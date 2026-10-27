import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DayOfWeek } from "@prisma/client";
import { brazilDateTimeToUtc, weekdayOfDate } from "@/lib/dates";

const DAY_INDEX: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export async function GET(req: NextRequest) {
  const clinicId = req.nextUrl.searchParams.get("clinicId");
  const dentistId = req.nextUrl.searchParams.get("dentistId");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  if (!clinicId || !dentistId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "clinicId, dentistId e date (AAAA-MM-DD) são obrigatórios" },
      { status: 400 }
    );
  }

  const [clinic, dentist] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: clinicId } }),
    prisma.dentist.findFirst({ where: { id: dentistId, clinicId, active: true } }),
  ]);
  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }
  if (!dentist) {
    return NextResponse.json({ error: "Dentista inválido" }, { status: 400 });
  }

  const dayOfWeek = DAY_INDEX[weekdayOfDate(date)];
  const workingHour = await prisma.workingHour.findUnique({
    where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
  });

  if (!workingHour || !workingHour.isActive) {
    return NextResponse.json({ slots: [] });
  }

  // Horário de funcionamento é cadastrado em horário de Brasília; o servidor
  // (Vercel) roda em UTC, então a conversão precisa ser explícita.
  const dayStart = brazilDateTimeToUtc(date, workingHour.startTime);
  const dayEnd = brazilDateTimeToUtc(date, workingHour.endTime);

  const existing = await prisma.appointment.findMany({
    where: {
      dentistId,
      status: { notIn: ["CANCELLED"] },
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
    select: { startAt: true, endAt: true },
  });

  const slots: string[] = [];
  const stepMs = clinic.slotDurationMinutes * 60_000;
  const now = new Date();

  for (
    let slotStart = new Date(dayStart);
    slotStart.getTime() + stepMs <= dayEnd.getTime();
    slotStart = new Date(slotStart.getTime() + stepMs)
  ) {
    const slotEnd = new Date(slotStart.getTime() + stepMs);
    const overlaps = existing.some((a) => slotStart < a.endAt && slotEnd > a.startAt);
    if (!overlaps && slotStart > now) {
      slots.push(slotStart.toISOString());
    }
  }

  return NextResponse.json({ slots });
}
