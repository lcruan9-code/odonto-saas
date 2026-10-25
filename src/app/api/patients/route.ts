import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { patientSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const patients = await prisma.patient.findMany({
    where: { clinicId: session.user.clinicId },
    include: { contacts: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { contacts, ...data } = parsed.data;
  const patient = await prisma.patient.create({
    data: {
      ...data,
      clinicId: session.user.clinicId,
      contacts: contacts ? { create: contacts } : undefined,
    },
    include: { contacts: true },
  });

  return NextResponse.json(patient, { status: 201 });
}
