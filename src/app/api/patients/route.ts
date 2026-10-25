import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { patientSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const clinicId = req.nextUrl.searchParams.get("clinicId");
  if (!clinicId) {
    return NextResponse.json({ error: "clinicId é obrigatório" }, { status: 400 });
  }

  const patients = await prisma.patient.findMany({
    where: { clinicId },
    include: { contacts: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = patientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { contacts, ...data } = parsed.data;
  const patient = await prisma.patient.create({
    data: {
      ...data,
      contacts: contacts ? { create: contacts } : undefined,
    },
    include: { contacts: true },
  });

  return NextResponse.json(patient, { status: 201 });
}
