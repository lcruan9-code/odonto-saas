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
        include: { dentist: { include: { user: true } } },
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patient = await prisma.patient.update({
    where: { id: existing.id },
    data: parsed.data,
    include: { contacts: true },
  });

  return NextResponse.json(patient);
}
