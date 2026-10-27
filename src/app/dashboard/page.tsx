import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatTime, getBrazilDayRange } from "@/lib/dates";
import {
  CalendarIcon,
  MailIcon,
  StethoscopeIcon,
  UsersIcon,
} from "@/components/dental-icons";
import { StatusBadge, STATUS_LABELS } from "./status-badge";
import { whiteLabel } from "@/config/white-label";

const colors = whiteLabel.colors;

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  const clinicId = session!.user.clinicId;
  const { start, end } = getBrazilDayRange();
  const now = new Date();

  const [clinic, todayAppointments, statusGroups, upcoming, patientCount, activeDentistCount, messageCount] =
    await Promise.all([
      prisma.clinic.findUnique({ where: { id: clinicId }, select: { name: true, slug: true } }),
      prisma.appointment.findMany({
        where: { clinicId, startAt: { gte: start, lt: end } },
        orderBy: { startAt: "asc" },
        include: { patient: true, dentist: { include: { user: true } } },
      }),
      prisma.appointment.groupBy({
        by: ["status"],
        where: { clinicId },
        _count: { _all: true },
      }),
      prisma.appointment.findMany({
        where: { clinicId, startAt: { gte: end }, status: { notIn: ["CANCELLED"] } },
        orderBy: { startAt: "asc" },
        take: 5,
        include: { patient: true, dentist: { include: { user: true } } },
      }),
      prisma.patient.count({ where: { clinicId } }),
      prisma.dentist.count({ where: { clinicId, active: true } }),
      prisma.contactMessage.count({ where: { clinicId } }),
    ]);

  const statusCounts: Record<string, number> = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all])
  );
  const totalAppointments = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const remainingToday = todayAppointments.filter(
    (a) => a.startAt >= now && a.status !== "CANCELLED"
  ).length;

  const kpis = [
    { label: "Consultas hoje", value: todayAppointments.length, hint: `${remainingToday} a seguir`, icon: CalendarIcon, color: colors.primary },
    { label: "Pacientes", value: patientCount, hint: "cadastrados", icon: UsersIcon, color: colors.secondary },
    { label: "Dentistas ativos", value: activeDentistCount, hint: "na agenda", icon: StethoscopeIcon, color: colors.accent },
    { label: "Mensagens do site", value: messageCount, hint: "recebidas", icon: MailIcon, color: colors.primary },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Olá, {session!.user.name?.split(" ")[0]} 👋</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{clinic?.name}</h1>
          <p className="text-sm text-slate-500">{formatDateTime(now, { dateStyle: "full" })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/agenda"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            + Novo agendamento
          </Link>
          {clinic && (
            <Link
              href={`/clinica/${clinic.slug}`}
              target="_blank"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              Ver site da clínica ↗
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: k.color }}
            >
              <k.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-sm font-medium text-slate-700">{k.label}</p>
            <p className="text-xs text-slate-500">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Agenda de hoje</h2>
            <Link href="/dashboard/agenda" className="text-sm font-medium text-primary">
              Ver agenda completa →
            </Link>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              Nenhuma consulta marcada para hoje.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayAppointments.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3">
                  <span className="w-14 shrink-0 rounded-lg bg-slate-100 py-1.5 text-center text-sm font-semibold">
                    {formatTime(a.startAt)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.patient.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {a.dentist.user.name}
                      {a.notes ? ` · ${a.notes}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Consultas por status</h2>
          <ul className="flex flex-col gap-3 text-sm">
            {Object.entries(STATUS_LABELS).map(([value, label]) => {
              const count = statusCounts[value] ?? 0;
              const pct = totalAppointments ? Math.round((count / totalAppointments) * 100) : 0;
              return (
                <li key={value}>
                  <div className="mb-1 flex justify-between">
                    <span>{label}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-mint" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold">Próximos dias</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma consulta futura agendada.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {upcoming.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span>
                  <span className="font-semibold">{formatDateTime(a.startAt)}</span> — {a.patient.name}{" "}
                  <span className="text-slate-500">com {a.dentist.user.name}</span>
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
