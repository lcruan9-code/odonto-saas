import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { patientUpdateSchema } from "@/lib/validation";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const patient = await prisma.patient.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
    include: {
      contacts: true,
      appointments: {
        select: {
          id: true,
          startAt: true,
          endAt: true,
          status: true,
          notes: true,
          service: { select: { name: true } },
          dentist: { select: { id: true, color: true, user: { select: { name: true } } } },
        },
        orderBy: { startAt: "desc" },
      },
    },
  });

  if (!patient) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  return NextResponse.json(patient);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const existing = await prisma.patient.findFirst({
    where: { id: params.id, clinicId: session.user.clinicId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = patientUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { contacts, ...data } = parsed.data;
  const patient = await prisma.$transaction(async (tx) => {
    if (contacts) {
      await tx.contact.deleteMany({ where: { patientId: existing.id } });
    }
    return tx.patient.update({
      where: { id: existing.id },
      data: { ...data, ...(contacts ? { contacts: { create: contacts } } : {}) },
      include: { contacts: true },
    });
  });

  return NextResponse.json(patient);
}
