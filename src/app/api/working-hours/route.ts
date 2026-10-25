import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { workingHourSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const workingHours = await prisma.workingHour.findMany({
    where: { clinicId: session.user.clinicId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(workingHours);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = workingHourSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dayOfWeek, ...data } = parsed.data;
  const clinicId = session.user.clinicId;

  const workingHour = await prisma.workingHour.upsert({
    where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
    update: data,
    create: { clinicId, dayOfWeek, ...data },
  });

  return NextResponse.json(workingHour);
}
