import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownDentistId } from "@/lib/staff";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const block = await prisma.timeBlock.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
  });
  if (!block) {
    return NextResponse.json({ error: "Bloqueio não encontrado" }, { status: 404 });
  }

  if (session.user.role === "DENTIST") {
    const own = await ownDentistId(session);
    if (!own || block.dentistId !== own) {
      return NextResponse.json(
        { error: "Você só pode remover bloqueios da sua própria agenda" },
        { status: 403 }
      );
    }
  }

  await prisma.timeBlock.delete({ where: { id: block.id } });
  return NextResponse.json({ ok: true });
}
