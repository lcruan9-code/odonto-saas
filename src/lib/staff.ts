import type { Session } from "next-auth";
import { prisma } from "@/lib/prisma";

/** Id do cadastro de dentista do usuário logado (perfil DENTIST), ou null. */
export async function ownDentistId(session: Session) {
  if (session.user.role !== "DENTIST") return null;
  const dentist = await prisma.dentist.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return dentist?.id ?? null;
}
