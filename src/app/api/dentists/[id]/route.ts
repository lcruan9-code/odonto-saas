import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dentistUpdateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dentist = await prisma.dentist.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
    include: { user: { select: { name: true, email: true } }, schedules: true },
  });
  if (!dentist) {
    return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
  }
  return NextResponse.json(dentist);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const existing = await prisma.dentist.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
    include: { user: { select: { email: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
  }

  const parsed = dentistUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { name, email, password, color, ...data } = parsed.data;

  if (email && email !== existing.user.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
    }
  }

  const userData: { name?: string; email?: string; passwordHash?: string } = {};
  if (name) userData.name = name;
  if (email) userData.email = email;
  if (password) userData.passwordHash = await bcrypt.hash(password, 10);

  const dentist = await prisma.dentist.update({
    where: { id: existing.id },
    data: {
      ...data,
      ...(color ? { color } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl || null } : {}),
      ...(Object.keys(userData).length > 0 ? { user: { update: userData } } : {}),
    },
    include: { user: { select: { name: true, email: true } }, schedules: true },
  });

  return NextResponse.json(dentist);
}

// Exclusão definitiva só para quem nunca teve consulta (cadastro feito por
// engano). Com histórico, o caminho é desativar, preservando prontuário.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const dentist = await prisma.dentist.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
    include: { _count: { select: { appointments: true } } },
  });
  if (!dentist) {
    return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
  }
  if (dentist._count.appointments > 0) {
    return NextResponse.json(
      { error: "Profissional com consultas no histórico não pode ser excluído. Desative o cadastro." },
      { status: 409 }
    );
  }

  // Remove o usuário de acesso; cadastro, grade e bloqueios caem em cascata.
  await prisma.user.delete({ where: { id: dentist.userId } });
  return NextResponse.json({ ok: true });
}
