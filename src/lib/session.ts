import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";

/**
 * Sessão obrigatória para páginas do painel (Server Components).
 * O middleware já barra /dashboard sem login; isto é a segunda camada, que
 * também tipa a sessão como não nula e permite restringir por perfil.
 */
export async function requireSession(roles?: Role[]) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (roles && !roles.includes(session.user.role)) redirect("/dashboard");
  return session;
}
