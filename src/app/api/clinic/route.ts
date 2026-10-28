import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clinicFullUpdateSchema } from "@/lib/validation";
import { deleteReplacedAssets } from "@/lib/assets";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const clinic = await prisma.clinic.findUnique({ where: { id: session.user.clinicId } });
  return NextResponse.json(clinic);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = clinicFullUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const before = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: { logoUrl: true, coverImageUrl: true, aboutImageUrl: true },
  });
  const clinic = await prisma.clinic.update({
    where: { id: session.user.clinicId },
    data: parsed.data,
  });
  if (before) {
    await deleteReplacedAssets(
      clinic.id,
      [before.logoUrl, before.coverImageUrl, before.aboutImageUrl],
      [clinic.logoUrl, clinic.coverImageUrl, clinic.aboutImageUrl]
    );
  }

  return NextResponse.json(clinic);
}
