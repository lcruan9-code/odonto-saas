import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactMessageSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Honeypot: se veio preenchido, é bot — responde OK sem gravar nada.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const { clinicId, name, email, phone, message } = parsed.data;

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  await prisma.contactMessage.create({
    data: {
      clinicId,
      name,
      email: email || null,
      phone: phone || null,
      message,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
