import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBrazilDayRange } from "@/lib/dates";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
  NO_SHOW: "Faltou",
};

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const clinicId = session!.user.clinicId;
  const { start, end } = getBrazilDayRange();
  const now = new Date();

  const [
    clinic,
    todayCount,
    statusGroups,
    upcoming,
    patientCount,
    activeDentistCount,
  ] = await Promise.all([
    prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true } }),
    prisma.appointment.count({
      where: { clinicId, startAt: { gte: start, lt: end } },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { clinicId },
      _count: { _all: true },
    }),
    prisma.appointment.findMany({
      where: { clinicId, startAt: { gte: now }, status: { notIn: ["CANCELLED"] } },
      orderBy: { startAt: "asc" },
      take: 5,
      include: { patient: true, dentist: { include: { user: true } } },
    }),
    prisma.patient.count({ where: { clinicId } }),
    prisma.dentist.count({ where: { clinicId, active: true } }),
  ]);

  const statusCounts = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all])
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold">Início</h1>
      <p className="mb-6 text-slate-500">{clinic?.name}</p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md border bg-white p-4">
          <p className="text-2xl font-semibold">{todayCount}</p>
          <p className="text-sm text-slate-500">Consultas hoje</p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="text-2xl font-semibold">{patientCount}</p>
          <p className="text-sm text-slate-500">Pacientes</p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="text-2xl font-semibold">{activeDentistCount}</p>
          <p className="text-sm text-slate-500">Dentistas ativos</p>
        </div>
        <div className="rounded-md border bg-white p-4">
          <p className="text-2xl font-semibold">{upcoming.length}</p>
          <p className="text-sm text-slate-500">Próximas consultas</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-md border bg-white p-4">
          <h2 className="mb-3 font-medium">Consultas por status</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <li key={value} className="flex justify-between border-b pb-1">
                <span>{label}</span>
                <span className="font-medium">{statusCounts[value] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-md border bg-white p-4">
          <h2 className="mb-3 font-medium">Próximas consultas</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma consulta futura agendada.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {upcoming.map((a) => (
                <li key={a.id} className="border-b pb-1">
                  <span className="font-medium">
                    {a.startAt.toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>{" "}
                  — {a.patient.name} com {a.dentist.user.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard/agenda"
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
        >
          Ir para agenda
        </Link>
        <Link
          href="/dashboard/pacientes"
          className="rounded-md border px-4 py-2 text-sm hover:bg-slate-100"
        >
          Pacientes
        </Link>
        <Link
          href="/dashboard/dentistas"
          className="rounded-md border px-4 py-2 text-sm hover:bg-slate-100"
        >
          Dentistas
        </Link>
        <Link
          href="/dashboard/administracao"
          className="rounded-md border px-4 py-2 text-sm hover:bg-slate-100"
        >
          Administração
        </Link>
      </div>
    </div>
  );
}
