import { Prisma } from "@prisma/client";

// Prisma reporta um conflito de escrita sob isolamento SERIALIZABLE com o
// código P2034 ("Transaction failed due to a write conflict or a deadlock").
// Usado para mitigar a corrida de dois agendamentos simultâneos no mesmo
// horário/dentista: não é uma garantia absoluta (uma constraint de exclusão
// no banco seria mais forte), mas evita a maior parte dos casos reais sem
// mudar o modelo de dados.
export function isWriteConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

export const SCHEDULING_CONFLICT_MESSAGE =
  "Esse horário acabou de ser preenchido. Escolha outro horário.";
