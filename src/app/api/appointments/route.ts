import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appointmentSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const clinicId = req.nextUrl.searchParams.get("clinicId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  if (!clinicId) {
    return NextResponse.json({ error: "clinicId é obrigatório" }, { status: 400 });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      clinicId,
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
  const body = await req.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (data.endAt <= data.startAt) {
    return NextResponse.json(
      { error: "Horário final deve ser depois do inicial" },
      { status: 400 }
    );
  }

  // Evita conflito de horário para o mesmo dentista
  const conflict = await prisma.appointment.findFirst({
    where: {
      dentistId: data.dentistId,
      status: { notIn: ["CANCELLED"] },
      startAt: { lt: data.endAt },
      endAt: { gt: data.startAt },
    },
  });

  if (conflict) {
    return NextResponse.json(
      { error: "Dentista já possui agendamento nesse horário" },
      { status: 409 }
    );
  }

  const appointment = await prisma.appointment.create({ data });
  return NextResponse.json(appointment, { status: 201 });
}
