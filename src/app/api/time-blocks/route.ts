import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeBlockSchema } from "@/lib/validation";
import { ownDentistId } from "@/lib/staff";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const from = req.nextUrl.searchParams.get("from");
  const blocks = await prisma.timeBlock.findMany({
    where: {
      clinicId: session.user.clinicId,
      ...(from ? { endAt: { gt: new Date(from) } } : {}),
    },
    orderBy: { startAt: "asc" },
    take: 200,
  });
  return NextResponse.json(blocks);
}

// Recepção e administração bloqueiam qualquer agenda (ou a clínica toda);
// o dentista só bloqueia a própria agenda.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const parsed = timeBlockSchema.safeParse(await req.json());
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const { dentistId, startAt, endAt, reason } = parsed.data;
  const clinicId = session.user.clinicId;

  if (session.user.role === "DENTIST") {
    const own = await ownDentistId(session);
    if (!own || dentistId !== own) {
      return NextResponse.json(
        { error: "Você só pode bloquear a sua própria agenda" },
        { status: 403 }
      );
    }
  }

  if (dentistId) {
    const dentist = await prisma.dentist.findFirst({ where: { id: dentistId, clinicId } });
    if (!dentist) {
      return NextResponse.json({ error: "Profissional inválido" }, { status: 400 });
    }
  }

  const block = await prisma.timeBlock.create({
    data: { clinicId, dentistId, startAt, endAt, reason: reason || null },
  });

  // O bloqueio não cancela nada sozinho: só avisa quantas consultas já
  // existentes caem nesse período, para a equipe remarcar.
  const overlapping = await prisma.appointment.count({
    where: {
      clinicId,
      status: { notIn: ["CANCELLED"] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(dentistId ? { dentistId } : {}),
    },
  });

  return NextResponse.json({ block, overlappingAppointments: overlapping }, { status: 201 });
}
