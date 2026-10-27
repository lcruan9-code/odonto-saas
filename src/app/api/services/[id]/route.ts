import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serviceUpdateSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const existing = await prisma.service.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = serviceUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const service = await prisma.service.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json(service);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const existing = await prisma.service.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }

  await prisma.service.delete({ where: { id: existing.id } });

  return NextResponse.json({ ok: true });
}
