import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.slug },
    include: {
      workingHours: { where: { isActive: true } },
      dentists: { include: { user: true } },
    },
  });

  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }

  return NextResponse.json({
    id: clinic.id,
    name: clinic.name,
    slug: clinic.slug,
    phone: clinic.phone,
    slotDurationMinutes: clinic.slotDurationMinutes,
    workingHours: clinic.workingHours,
    dentists: clinic.dentists.map((d) => ({
      id: d.id,
      name: d.user.name,
      specialty: d.specialty,
    })),
  });
}
