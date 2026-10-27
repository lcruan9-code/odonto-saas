import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PatientsTable, type PatientRow } from "./patients-table";

export default async function PacientesPage() {
  const session = await requireSession();
  const clinicId = session.user.clinicId;

  const [patients, dentists] = await Promise.all([
    prisma.patient.findMany({
      where: { clinicId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        contacts: { select: { type: true, value: true, isPrimary: true } },
        _count: { select: { appointments: true } },
        // Consulta mais recente (passada ou já marcada): base do "último serviço".
        appointments: {
          orderBy: { startAt: "desc" },
          take: 1,
          select: {
            startAt: true,
            status: true,
            service: { select: { name: true } },
            dentist: { select: { id: true, color: true, user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.dentist.findMany({
      where: { clinicId },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const rows: PatientRow[] = patients.map((p) => {
    const pick = (type: string) =>
      p.contacts.find((c) => c.type === type && c.isPrimary) ??
      p.contacts.find((c) => c.type === type);
    const last = p.appointments[0];
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
