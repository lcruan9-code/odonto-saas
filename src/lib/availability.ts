import type { DayOfWeek, Prisma } from "@prisma/client";
import { brazilDateTimeToUtc, toBrazilLocalInput, weekdayOfDate } from "@/lib/dates";

type Db = Prisma.TransactionClient;

/** Bloqueio que se sobrepõe ao período (do dentista ou da clínica inteira). */
export function findBlockConflict(
  db: Db,
  args: { clinicId: string; dentistId: string; startAt: Date; endAt: Date }
) {
  return db.timeBlock.findFirst({
    where: {
      clinicId: args.clinicId,
      startAt: { lt: args.endAt },
      endAt: { gt: args.startAt },
      OR: [{ dentistId: null }, { dentistId: args.dentistId }],
    },
    select: { id: true, reason: true },
  });
}

export function blockedMessage(reason: string | null) {
  return reason ? `Horário bloqueado na agenda: ${reason}.` : "Horário bloqueado na agenda.";
}

const DAY_INDEX: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

type Interval = { start: Date; end: Date };

function intersect(a: Interval[], b: Interval[]) {
  const out: Interval[] = [];
  for (const x of a) {
    for (const y of b) {
      const start = x.start > y.start ? x.start : y.start;
      const end = x.end < y.end ? x.end : y.end;
      if (start < end) out.push({ start, end });
    }
  }
  return out;
}

/**
 * Janelas de atendimento do profissional numa data ("AAAA-MM-DD", horário de
 * Brasília), já em UTC. Regra:
 * - horário de funcionamento da clínica é o limite externo (dia fechado = sem horários);
 * - se o profissional tem grade cadastrada, vale a grade do dia (com intervalo);
 * - sem grade nenhuma (cadastro antigo), vale o horário da clínica.
 */
export async function getWorkWindows(
  db: Db,
  args: { clinicId: string; dentistId: string; date: string }
): Promise<Interval[]> {
  const dayOfWeek = DAY_INDEX[weekdayOfDate(args.date)];
  const [clinicHour, schedules] = await Promise.all([
    db.workingHour.findUnique({
      where: { clinicId_dayOfWeek: { clinicId: args.clinicId, dayOfWeek } },
    }),
    db.dentistSchedule.findMany({ where: { dentistId: args.dentistId } }),
  ]);

  if (!clinicHour || !clinicHour.isActive) return [];
  const clinicWindow = [
    {
      start: brazilDateTimeToUtc(args.date, clinicHour.startTime),
      end: brazilDateTimeToUtc(args.date, clinicHour.endTime),
    },
  ];
  if (schedules.length === 0) return clinicWindow;

  const day = schedules.find((s) => s.dayOfWeek === dayOfWeek && s.isActive);
  if (!day) return [];

  const at = (hhmm: string) => brazilDateTimeToUtc(args.date, hhmm);
  const dentistWindows =
    day.breakStart && day.breakEnd
      ? [
          { start: at(day.startTime), end: at(day.breakStart) },
          { start: at(day.breakEnd), end: at(day.endTime) },
        ]
      : [{ start: at(day.startTime), end: at(day.endTime) }];

  return intersect(clinicWindow, dentistWindows);
}

/** Horários livres (início em ISO) do profissional numa data. */
export async function getFreeSlots(
  db: Db,
  args: { clinicId: string; dentistId: string; date: string; slotMinutes: number; now?: Date }
) {
  const windows = await getWorkWindows(db, args);
  if (windows.length === 0) return [];

  const dayStart = windows[0].start;
  const dayEnd = windows[windows.length - 1].end;
  const [appointments, blocks] = await Promise.all([
    db.appointment.findMany({
      where: {
        dentistId: args.dentistId,
        status: { notIn: ["CANCELLED"] },
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
      },
      select: { startAt: true, endAt: true },
    }),
    db.timeBlock.findMany({
      where: {
        clinicId: args.clinicId,
        startAt: { lt: dayEnd },
        endAt: { gt: dayStart },
        OR: [{ dentistId: null }, { dentistId: args.dentistId }],
      },
      select: { startAt: true, endAt: true },
    }),
  ]);
  const busy = [...appointments, ...blocks];

  const stepMs = args.slotMinutes * 60_000;
  const now = args.now ?? new Date();
  const slots: string[] = [];
  for (const w of windows) {
    for (let t = w.start.getTime(); t + stepMs <= w.end.getTime(); t += stepMs) {
      const start = new Date(t);
      const end = new Date(t + stepMs);
      if (start <= now) continue;
      if (busy.some((b) => start < b.endAt && end > b.startAt)) continue;
      slots.push(start.toISOString());
    }
  }
  return slots;
}

/** O período cabe inteiro numa janela de atendimento do profissional? */
export async function isWithinWorkHours(
  db: Db,
  args: { clinicId: string; dentistId: string; startAt: Date; endAt: Date }
) {
  const date = toBrazilLocalInput(args.startAt).slice(0, 10);
  const windows = await getWorkWindows(db, { ...args, date });
  return windows.some((w) => args.startAt >= w.start && args.endAt <= w.end);
}
