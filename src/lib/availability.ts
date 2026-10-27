import type { Prisma } from "@prisma/client";

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
