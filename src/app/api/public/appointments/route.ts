import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyAppointmentCreated } from "@/lib/notifications";
import { isWriteConflict, SCHEDULING_CONFLICT_MESSAGE } from "@/lib/scheduling";
import { findBlockConflict, isWithinWorkHours } from "@/lib/availability";

const publicBookingSchema = z.object({
  clinicId: z.string().min(1),
  dentistId: z.string().min(1),
  startAt: z.coerce.date(),
  patientName: z.string().min(2),
  contactType: z.enum(["PHONE", "WHATSAPP", "EMAIL"]),
  contactValue: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = publicBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clinicId, dentistId, startAt, patientName, contactType, contactValue } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  const dentist = await prisma.dentist.findFirst({ where: { id: dentistId, clinicId, active: true } });
  if (!dentist) {
    return NextResponse.json({ error: "Dentista inválido" }, { status: 400 });
  }

  if (startAt <= new Date()) {
    return NextResponse.json({ error: "Horário inválido" }, { status: 400 });
  }

  const endAt = new Date(startAt.getTime() + clinic.slotDurationMinutes * 60_000);

  if (!(await isWithinWorkHours(prisma, { clinicId, dentistId, startAt, endAt }))) {
    return NextResponse.json({ error: "Horário fora do expediente do profissional" }, { status: 409 });
  }

  let appointment;
  try {
    appointment = await prisma.$transaction(
      async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            dentistId,
            status: { notIn: ["CANCELLED"] },
            startAt: { lt: endAt },
            endAt: { gt: startAt },
          },
        });
        if (conflict) {
          throw new Error("CONFLICT");
        }

        // Bloqueio feito no painel (do profissional ou da clínica inteira).
        const block = await findBlockConflict(tx, { clinicId, dentistId, startAt, endAt });
        if (block) {
          throw new Error("CONFLICT");
        }

        // Só cadastra o paciente depois de garantir o horário, para não criar
        // pacientes órfãos quando o agendamento é recusado.
        const patient =
          (await tx.patient.findFirst({
            where: { clinicId, contacts: { some: { value: contactValue } } },
            select: { id: true },
          })) ??
          (await tx.patient.create({
            data: {
              clinicId,
              name: patientName,
              contacts: { create: { type: contactType, value: contactValue, isPrimary: true } },
            },
            select: { id: true },
          }));

        return tx.appointment.create({
          data: { clinicId, dentistId, patientId: patient.id, startAt, endAt },
          include: { dentist: { include: { user: true } }, clinic: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      return NextResponse.json({ error: "Horário indisponível" }, { status: 409 });
    }
    if (isWriteConflict(err)) {
      return NextResponse.json({ error: SCHEDULING_CONFLICT_MESSAGE }, { status: 409 });
    }
    throw err;
  }

  await notifyAppointmentCreated({
    patientName,
    clinicName: appointment.clinic.name,
    dentistName: appointment.dentist.user.name,
    startAt: appointment.startAt,
  });

  return NextResponse.json(appointment, { status: 201 });
}
