import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appointmentUpdateSchema } from "@/lib/validation";
import { notifyAppointmentCreated } from "@/lib/notifications";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const clinicId = session.user.clinicId;

  const existing = await prisma.appointment.findFirst({
    where: { id: params.id, clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = appointmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const dentistId = data.dentistId ?? existing.dentistId;
  const startAt = data.startAt ?? existing.startAt;
  const endAt = data.endAt ?? existing.endAt;

  if (endAt <= startAt) {
    return NextResponse.json(
      { error: "Horário final deve ser depois do inicial" },
      { status: 400 }
    );
  }

  if (data.dentistId) {
    const dentist = await prisma.dentist.findFirst({
      where: { id: dentistId, clinicId, active: true },
    });
    if (!dentist) {
      return NextResponse.json({ error: "Dentista inválido" }, { status: 400 });
    }
  }

  const timeOrDentistChanged =
    data.dentistId !== undefined || data.startAt !== undefined || data.endAt !== undefined;

  if (timeOrDentistChanged && data.status !== "CANCELLED") {
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: existing.id },
        dentistId,
        status: { notIn: ["CANCELLED"] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "Dentista já possui agendamento nesse horário" },
        { status: 409 }
      );
    }
  }

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: {
      dentistId,
      startAt,
      endAt,
      status: data.status ?? undefined,
      notes: data.notes ?? undefined,
    },
    include: { patient: true, dentist: { include: { user: true } }, clinic: true },
  });

  if (timeOrDentistChanged) {
    await notifyAppointmentCreated({
      patientName: appointment.patient.name,
      clinicName: appointment.clinic.name,
      dentistName: appointment.dentist.user.name,
      startAt: appointment.startAt,
    });
  }

  return NextResponse.json(appointment);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const existing = await prisma.appointment.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }

  const appointment = await prisma.appointment.update({
    where: { id: existing.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json(appointment);
}
