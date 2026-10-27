import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Consultas e bloqueios que cruzam o período visível do calendário.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const start = new Date(req.nextUrl.searchParams.get("start") ?? "");
  const end = new Date(req.nextUrl.searchParams.get("end") ?? "");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 });
  }
  if (end.getTime() - start.getTime() > 62 * 24 * 3600_000) {
    return NextResponse.json({ error: "Período máximo de 62 dias" }, { status: 400 });
  }

  const clinicId = session.user.clinicId;
  const overlap = { startAt: { lt: end }, endAt: { gt: start } };

  const [appointments, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: { clinicId, ...overlap },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        startAt: true,
        endAt: true,
        status: true,
        notes: true,
        dentistId: true,
        serviceId: true,
        service: { select: { name: true } },
        patient: {
          select: {
            id: true,
            name: true,
            contacts: { select: { type: true, value: true, isPrimary: true } },
          },
        },
      },
    }),
    prisma.timeBlock.findMany({
      where: { clinicId, ...overlap },
      orderBy: { startAt: "asc" },
      select: { id: true, startAt: true, endAt: true, reason: true, dentistId: true },
    }),
  ]);

  return NextResponse.json({
    appointments: appointments.map((a) => {
      const phone =
        a.patient.contacts.find((c) => c.type === "WHATSAPP") ??
        a.patient.contacts.find((c) => c.type === "PHONE");
      return {
        id: a.id,
        startAt: a.startAt,
        endAt: a.endAt,
        status: a.status,
        notes: a.notes,
        dentistId: a.dentistId,
        serviceId: a.serviceId,
        serviceName: a.service?.name ?? null,
        patientId: a.patient.id,
        patientName: a.patient.name,
        patientPhone: phone?.value ?? null,
      };
    }),
    blocks,
  });
}
