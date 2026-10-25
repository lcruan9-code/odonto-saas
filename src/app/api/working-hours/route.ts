import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workingHourSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const clinicId = req.nextUrl.searchParams.get("clinicId");
  if (!clinicId) {
    return NextResponse.json({ error: "clinicId é obrigatório" }, { status: 400 });
  }

  const workingHours = await prisma.workingHour.findMany({
    where: { clinicId },
    orderBy: { dayOfWeek: "asc" },
  });

  return NextResponse.json(workingHours);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const parsed = workingHourSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { clinicId, dayOfWeek, ...data } = parsed.data;

  const workingHour = await prisma.workingHour.upsert({
    where: { clinicId_dayOfWeek: { clinicId, dayOfWeek } },
    update: data,
    create: { clinicId, dayOfWeek, ...data },
  });

  return NextResponse.json(workingHour);
}
