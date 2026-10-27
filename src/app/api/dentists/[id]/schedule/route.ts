import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dentistScheduleSchema } from "@/lib/validation";
import { replaceDentistSchedule } from "@/lib/dentist-schedule";

const DAY_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const schedules = await prisma.dentistSchedule.findMany({
    where: { dentistId: params.id, clinicId: session.user.clinicId },
  });
  schedules.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));
  return NextResponse.json(schedules);
}

// Substitui a grade semanal inteira; dias ausentes ficam sem atendimento.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const clinicId = session.user.clinicId;
  const dentist = await prisma.dentist.findFirst({ where: { id: params.id, clinicId } });
  if (!dentist) {
    return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
  }

  const parsed = dentistScheduleSchema.safeParse(await req.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Grade inválida";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await prisma.$transaction((tx) =>
    replaceDentistSchedule(tx, { clinicId, dentistId: dentist.id, days: parsed.data })
  );

  const schedules = await prisma.dentistSchedule.findMany({ where: { dentistId: dentist.id } });
  return NextResponse.json(schedules);
}
