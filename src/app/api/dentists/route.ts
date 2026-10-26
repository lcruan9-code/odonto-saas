import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dentistCreateSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dentists = await prisma.dentist.findMany({
    where: { clinicId: session.user.clinicId },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(dentists);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = dentistCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password, specialty, cro } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const dentist = await prisma.user.create({
    data: {
      clinicId: session.user.clinicId,
      name,
      email,
      passwordHash,
      role: "DENTIST",
      dentist: {
        create: {
          clinicId: session.user.clinicId,
          specialty,
          cro,
        },
      },
    },
    include: { dentist: true },
  });

  return NextResponse.json(dentist, { status: 201 });
}
