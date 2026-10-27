import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PatientsTable, type PatientRow } from "./patients-table";

export default async function PacientesPage() {
  const session = await requireSession();
  const clinicId = session.user.clinicId;

  const now = new Date();
  const appointmentSelect = {
    patientId: true,
    startAt: true,
    status: true,
    service: { select: { name: true } },
    dentist: { select: { id: true, color: true, user: { select: { name: true } } } },
  } as const;

  const [patients, dentists, lastPast, nextUpcoming] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contacts: { select: { type: true, value: true, isPrimary: true } },
        _count: { select: { appointments: true } },
      },
    }),
    prisma.dentist.findMany({
      where: { clinicId },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    // "Último serviço": a consulta mais recente que já aconteceu; quem só
    // tem consultas futuras mostra a próxima marcada.
    prisma.appointment.findMany({
      where: { clinicId, startAt: { lte: now } },
      orderBy: [{ patientId: "asc" }, { startAt: "desc" }],
      distinct: ["patientId"],
      select: appointmentSelect,
    }),
    prisma.appointment.findMany({
      where: { clinicId, startAt: { gt: now } },
      orderBy: [{ patientId: "asc" }, { startAt: "asc" }],
      distinct: ["patientId"],
      select: appointmentSelect,
    }),
  ]);
  const pastByPatient = new Map(lastPast.map((a) => [a.patientId, a]));
  const nextByPatient = new Map(nextUpcoming.map((a) => [a.patientId, a]));

  const rows: PatientRow[] = patients.map((p) => {
    const pick = (type: string) =>
      p.contacts.find((c) => c.type === type && c.isPrimary) ??
      p.contacts.find((c) => c.type === type);
    const last = pastByPatient.get(p.id) ?? nextByPatient.get(p.id);
    return {
      id: p.id,
      name: p.name,
      whatsapp: (pick("WHATSAPP") ?? pick("PHONE"))?.value ?? null,
      email: pick("EMAIL")?.value ?? null,
      appointmentCount: p._count.appointments,
      lastService: last ? last.service?.name ?? "Consulta" : null,
      lastAt: last ? last.startAt.toISOString() : null,
      lastDentistId: last?.dentist.id ?? null,
      lastDentistName: last?.dentist.user.name ?? null,
      lastDentistColor: last?.dentist.color ?? null,
      lastStatus: last?.status ?? null,
    };
  });

  return (
    <PatientsTable
      data={rows}
      dentists={dentists.map((d) => ({ id: d.id, name: d.user.name }))}
    />
  );
}
