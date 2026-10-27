import type { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { dentistScheduleSchema } from "@/lib/validation";
import { whiteLabel } from "@/config/white-label";

type Db = Prisma.TransactionClient;
export type ScheduleInput = z.infer<typeof dentistScheduleSchema>;

/** Substitui a grade semanal inteira do profissional. */
export async function replaceDentistSchedule(
  db: Db,
  args: { clinicId: string; dentistId: string; days: ScheduleInput }
) {
  await db.dentistSchedule.deleteMany({ where: { dentistId: args.dentistId } });
  if (args.days.length === 0) return;
  await db.dentistSchedule.createMany({
    data: args.days.map((d) => ({
      clinicId: args.clinicId,
      dentistId: args.dentistId,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      breakStart: d.breakStart || null,
      breakEnd: d.breakEnd || null,
      isActive: d.isActive,
    })),
  });
}

/** Primeira cor da paleta white-label ainda não usada na clínica. */
export async function nextDentistColor(db: Db, clinicId: string) {
  const used = await db.dentist.findMany({ where: { clinicId }, select: { color: true } });
  const taken = new Set(used.map((d) => d.color.toLowerCase()));
  const palette = whiteLabel.dentistColors;
  return palette.find((c) => !taken.has(c.toLowerCase())) ?? palette[used.length % palette.length];
}
