import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dentistCreateWithScheduleSchema } from "@/lib/validation";
import { nextDentistColor, replaceDentistSchedule } from "@/lib/dentist-schedule";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const dentists = await prisma.dentist.findMany({
    where: { clinicId: session.user.clinicId },
    include: {
      user: { select: { id: true, name: true, email: true, active: true } },
      schedules: true,
    },
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

  const parsed = dentistCreateWithScheduleSchema.safeParse(await req.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { name, email, password, schedule, color, ...profile } = parsed.data;
  const clinicId = session.user.clinicId;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Já existe um usuário com esse e-mail" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const dentist = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { clinicId, name, email, passwordHash, role: "DENTIST" },
    });
    const created = await tx.dentist.create({
      data: {
        clinicId,
        userId: user.id,
        specialty: profile.specialty || null,
        cro: profile.cro || null,
        publicBio: profile.publicBio || null,
        photoUrl: profile.photoUrl || null,
        publicVisible: profile.publicVisible ?? true,
        color: color || (await nextDentistColor(tx, clinicId)),
      },
    });
    if (schedule) {
      await replaceDentistSchedule(tx, { clinicId, dentistId: created.id, days: schedule });
    }
    return tx.dentist.findUniqueOrThrow({
      where: { id: created.id },
      include: { user: { select: { name: true, email: true } }, schedules: true },
    });
  });

  return NextResponse.json(dentist, { status: 201 });
}
