import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFreeSlots } from "@/lib/availability";

// Horários livres para o agendamento público: considera o funcionamento da
// clínica, a grade do profissional (com intervalo), consultas já marcadas e
// bloqueios feitos no painel.
export async function GET(req: NextRequest) {
  const clinicId = req.nextUrl.searchParams.get("clinicId");
  const dentistId = req.nextUrl.searchParams.get("dentistId");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD

  if (!clinicId || !dentistId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "clinicId, dentistId e date (AAAA-MM-DD) são obrigatórios" },
      { status: 400 }
    );
  }

  const [clinic, dentist] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: clinicId } }),
    prisma.dentist.findFirst({ where: { id: dentistId, clinicId, active: true } }),
  ]);
  if (!clinic) {
    return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });
  }
  if (!dentist) {
    return NextResponse.json({ error: "Dentista inválido" }, { status: 400 });
  }

  const slots = await getFreeSlots(prisma, {
    clinicId,
    dentistId,
    date,
    slotMinutes: clinic.slotDurationMinutes,
  });
  return NextResponse.json({ slots });
}
