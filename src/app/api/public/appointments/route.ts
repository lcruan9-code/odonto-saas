import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAppointmentCreated } from "@/lib/notifications";

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

  const conflict = await prisma.appointment.findFirst({
    where: {
      dentistId,
      status: { notIn: ["CANCELLED"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Horário indisponível" }, { status: 409 });
  }

  let patient = await prisma.patient.findFirst({
    where: { clinicId, contacts: { some: { value: contactValue } } },
  });

  if (!patient) {
    patient = await prisma.patient.create({
      data: {
        clinicId,
        name: patientName,
        contacts: { create: { type: contactType, value: contactValue, isPrimary: true } },
      },
    });
  }

  const appointment = await prisma.appointment.create({
    data: { clinicId, dentistId, patientId: patient.id, startAt, endAt },
    include: { dentist: { include: { user: true } }, clinic: true },
  });

  await notifyAppointmentCreated({
    patientName,
    clinicName: appointment.clinic.name,
    dentistName: appointment.dentist.user.name,
    startAt: appointment.startAt,
  });

  return NextResponse.json(appointment, { status: 201 });
}
