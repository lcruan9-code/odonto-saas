import Link from "next/link";
import type { DayOfWeek } from "@prisma/client";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBrazilDayRange } from "@/lib/dates";
import { ownDentistId } from "@/lib/staff";
import { AgendaCalendar } from "./agenda-calendar-loader";
import { AppointmentRow } from "./appointment-row";
import { NewAppointmentForm } from "./new-appointment-form";

const WEEKDAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { periodo?: string; view?: string };
}) {
  const session = await requireSession();
  const clinicId = session.user.clinicId;
  const listView = searchParams.view === "lista";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm">
          {[
            { href: "/dashboard/agenda", label: "Calendário", active: !listView },
            { href: "/dashboard/agenda?view=lista", label: "Lista", active: listView },
          ].map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-1.5 font-medium ${
                tab.active ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {listView ? (
        <AgendaList clinicId={clinicId} past={searchParams.periodo === "anteriores"} />
      ) : (
        <CalendarView clinicId={clinicId} session={session} />
      )}
    </div>
  );
}

async function CalendarView({
  clinicId,
  session,
}: {
  clinicId: string;
  session: Awaited<ReturnType<typeof requireSession>>;
}) {
  const [dentists, patients, services, workingHours, clinic, own] = await Promise.all([
    prisma.dentist.findMany({
      where: { clinicId, active: true },
      include: { user: { select: { name: true } }, schedules: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.patient.findMany({
      where: { clinicId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.service.findMany({
      where: { clinicId, active: true },
      select: { id: true, name: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    }),
    prisma.workingHour.findMany({ where: { clinicId, isActive: true } }),
    prisma.clinic.findUnique({ where: { id: clinicId }, select: { slotDurationMinutes: true } }),
    ownDentistId(session),
  ]);

  return (
    <AgendaCalendar
      dentists={dentists.map((d) => ({
        id: d.id,
        name: d.user.name,
        color: d.color,
        schedules: d.schedules.map((s) => ({
          dayOfWeek: WEEKDAY_INDEX[s.dayOfWeek],
          startTime: s.startTime,
          endTime: s.endTime,
          isActive: s.isActive,
        })),
      }))}
      patients={patients}
      services={services}
      clinicHours={workingHours.map((h) => ({
        daysOfWeek: [WEEKDAY_INDEX[h.dayOfWeek]],
        startTime: h.startTime,
        endTime: h.endTime,
      }))}
      slotDurationMinutes={clinic?.slotDurationMinutes ?? 30}
      ownDentistId={own}
    />
  );
}

async function AgendaList({ clinicId, past }: { clinicId: string; past: boolean }) {
  const { start: todayStart } = getBrazilDayRange();

  const [appointments, patients, dentists, clinic] = await Promise.all([
    prisma.appointment.findMany({
      where: { clinicId, startAt: past ? { lt: todayStart } : { gte: todayStart } },
      include: { patient: true, dentist: { include: { user: true } } },
      orderBy: { startAt: past ? "desc" : "asc" },
      take: 100,
    }),
    prisma.patient.findMany({ where: { clinicId }, orderBy: { name: "asc" } }),
    prisma.dentist.findMany({
      where: { clinicId, active: true },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.clinic.findUnique({ where: { id: clinicId } }),
  ]);

  const dentistOptions = dentists.map((d) => ({ id: d.id, name: d.user.name }));
  const patientOptions = patients.map((p) => ({ id: p.id, name: p.name }));

  return (
    <div>
      <div className="mb-4">
        <NewAppointmentForm
          patients={patientOptions}
          dentists={dentistOptions}
          slotDurationMinutes={clinic?.slotDurationMinutes ?? 30}
        />
      </div>

      <div className="mb-3 inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm">
        {[
          { href: "/dashboard/agenda?view=lista", label: "A partir de hoje", active: !past },
          { href: "/dashboard/agenda?view=lista&periodo=anteriores", label: "Anteriores", active: past },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-4 py-1.5 font-medium ${
              tab.active ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-3">Data/Hora</th>
              <th className="p-3">Paciente</th>
              <th className="p-3">Dentista</th>
              <th className="p-3">Status</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <AppointmentRow
                key={a.id}
                appointment={{
                  id: a.id,
                  startAt: a.startAt.toISOString(),
                  status: a.status,
                  patient: { name: a.patient.name },
                  dentist: { id: a.dentist.id, user: { name: a.dentist.user.name } },
                }}
                dentists={dentistOptions}
                slotDurationMinutes={clinic?.slotDurationMinutes ?? 30}
              />
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-slate-500">
                  Nenhum agendamento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
