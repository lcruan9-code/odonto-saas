import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DayOfWeek } from "@prisma/client";

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

  if (!clinicId || !dentistId || !date) {
    return NextResponse.json(
      { error: "clinicId, dentistId e date são obrigatórios" },
      { status: 400 }
    );
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  const targetDate = new Date(`${date}T00:00:00`);
  const dayOfWeek = DAY_INDEX[targetDate.getDay()];

  const workingHour = await prisma.workingHour.findUnique({
    where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
  });

  if (!workingHour || !workingHour.isActive) {
    return NextResponse.json({ slots: [] });
  }

  const slotMinutes = clinic.slotDurationMinutes;
  const [startH, startM] = workingHour.startTime.split(":").map(Number);
  const [endH, endM] = workingHour.endTime.split(":").map(Number);

  const dayStart = new Date(targetDate);
  dayStart.setHours(startH, startM, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(endH, endM, 0, 0);

  const existing = await prisma.appointment.findMany({
    where: {
      dentistId,
      status: { notIn: ["CANCELLED"] },
      startAt: { gte: dayStart, lt: dayEnd },
    },
    select: { startAt: true, endAt: true },
  });

  const slots: string[] = [];
  const stepMs = slotMinutes * 60_000;
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
