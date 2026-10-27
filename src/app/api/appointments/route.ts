import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validation";
import { notifyAppointmentCreated } from "@/lib/notifications";
import { isWriteConflict, SCHEDULING_CONFLICT_MESSAGE } from "@/lib/scheduling";
import { blockedMessage, findBlockConflict } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId: session.user.clinicId,
      ...(from && to
        ? { startAt: { gte: new Date(from), lte: new Date(to) } }
        : {}),
    },
    include: { patient: true, dentist: { include: { user: true } } },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const clinicId = session.user.clinicId;

  if (data.endAt <= data.startAt) {
    return NextResponse.json(
      { error: "Horário final deve ser depois do inicial" },
      { status: 400 }
    );
  }

  const dentist = await prisma.dentist.findFirst({
    where: { id: data.dentistId, clinicId, active: true },
  });
  if (!dentist) {
    return NextResponse.json({ error: "Dentista inválido" }, { status: 400 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: data.patientId, clinicId },
  });
  if (!patient) {
    return NextResponse.json({ error: "Paciente inválido" }, { status: 400 });
  }

  if (data.serviceId) {
    const service = await prisma.service.findFirst({ where: { id: data.serviceId, clinicId } });
    if (!service) {
      return NextResponse.json({ error: "Serviço inválido" }, { status: 400 });
    }
  }

  let blockReason: string | null = null;
  let appointment;
  try {
    appointment = await prisma.$transaction(
      async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            dentistId: data.dentistId,
            status: { notIn: ["CANCELLED"] },
            startAt: { lt: data.endAt },
            endAt: { gt: data.startAt },
          },
        });
        if (conflict) {
          throw new Error("CONFLICT");
        }

        const block = await findBlockConflict(tx, {
          clinicId,
          dentistId: data.dentistId,
          startAt: data.startAt,
          endAt: data.endAt,
        });
        if (block) {
          blockReason = block.reason;
          throw new Error("BLOCKED");
        }

        return tx.appointment.create({
          data: { ...data, clinicId },
          include: { patient: true, dentist: { include: { user: true } }, clinic: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "CONFLICT") {
      return NextResponse.json(
        { error: "Dentista já possui agendamento nesse horário" },
        { status: 409 }
      );
    }
    if (err instanceof Error && err.message === "BLOCKED") {
      return NextResponse.json({ error: blockedMessage(blockReason) }, { status: 409 });
    }
    if (isWriteConflict(err)) {
      return NextResponse.json({ error: SCHEDULING_CONFLICT_MESSAGE }, { status: 409 });
    }
    throw err;
  }

  await notifyAppointmentCreated({
    patientName: appointment.patient.name,
    clinicName: appointment.clinic.name,
    dentistName: appointment.dentist.user.name,
    startAt: appointment.startAt,
  });

  return NextResponse.json(appointment, { status: 201 });
}
