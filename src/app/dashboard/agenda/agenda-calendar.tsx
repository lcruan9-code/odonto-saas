"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type {
  DateSelectArg,
  EventChangeArg,
  EventClickArg,
  EventContentArg,
  EventInput,
  EventSourceFuncArg,
} from "@fullcalendar/core";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toBrazilLocalInput } from "@/lib/dates";
import { CreateDialog, selectClass, type CreateDraft } from "./create-dialog";
import { DetailsDialog, type Selected } from "./details-dialog";
import {
  calendarDateToInput,
  fromCalendarDate,
  readError,
  toCalendarDate,
  type AgendaAppointment,
  type AgendaBlock,
  type AgendaDentist,
  type AgendaOption,
} from "./calendar-utils";

type BusinessHour = { daysOfWeek: number[]; startTime: string; endTime: string };

export default function AgendaCalendar({
  dentists,
  patients,
  services,
  clinicHours,
  slotDurationMinutes,
  ownDentistId,
}: {
  dentists: AgendaDentist[];
  patients: AgendaOption[];
  services: AgendaOption[];
  clinicHours: BusinessHour[];
  slotDurationMinutes: number;
  ownDentistId: string | null;
}) {
  const calendarRef = useRef<FullCalendar>(null);
  const [filter, setFilter] = useState(ownDentistId ?? "");
  const filterRef = useRef(filter);
  const [draft, setDraft] = useState<CreateDraft | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const dentistById = useMemo(() => new Map(dentists.map((d) => [d.id, d])), [dentists]);

  // Com um profissional filtrado, a área "útil" da grade passa a ser o
  // expediente dele; sem filtro, o horário de funcionamento da clínica.
  const businessHours = useMemo<BusinessHour[]>(() => {
    const dentist = filter ? dentistById.get(filter) : null;
    if (!dentist) return clinicHours;
    return dentist.schedules
      .filter((s) => s.isActive)
      .map((s) => ({ daysOfWeek: [s.dayOfWeek], startTime: s.startTime, endTime: s.endTime }));
  }, [filter, dentistById, clinicHours]);

  const { slotMinTime, slotMaxTime } = useMemo(() => {
    const all = [
      ...clinicHours,
      ...dentists.flatMap((d) =>
        d.schedules.map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
      ),
    ];
    if (all.length === 0) return { slotMinTime: "07:00", slotMaxTime: "20:00" };
    const min = all.reduce((m, h) => (h.startTime < m ? h.startTime : m), "23:59");
    const max = all.reduce((m, h) => (h.endTime > m ? h.endTime : m), "00:00");
    const pad = (h: number) => `${String(Math.min(Math.max(h, 0), 24)).padStart(2, "0")}:00`;
    return {
      slotMinTime: pad(Number(min.slice(0, 2)) - 1),
      slotMaxTime: pad(Number(max.slice(0, 2)) + (max.slice(3) === "00" ? 1 : 2)),
    };
  }, [clinicHours, dentists]);

  const fetchEvents = useCallback(
    async (info: EventSourceFuncArg): Promise<EventInput[]> => {
      const params = new URLSearchParams({
        start: fromCalendarDate(info.start).toISOString(),
        end: fromCalendarDate(info.end).toISOString(),
      });
      const res = await fetch(`/api/agenda/events?${params}`);
      if (!res.ok) throw new Error(await readError(res, "Não foi possível carregar a agenda"));
      const data: { appointments: AgendaAppointment[]; blocks: AgendaBlock[] } = await res.json();
      const only = filterRef.current;

      const appointments: EventInput[] = data.appointments
        .filter((a) => !only || a.dentistId === only)
        .map((a) => {
          const color = dentistById.get(a.dentistId)?.color ?? "#64748b";
          const cancelled = a.status === "CANCELLED";
          return {
            id: `a:${a.id}`,
            title: a.patientName,
            start: toCalendarDate(a.startAt),
            end: toCalendarDate(a.endAt),
            backgroundColor: color,
            borderColor: color,
            editable: !cancelled,
            classNames: cancelled ? ["fc-event-cancelled"] : [],
            extendedProps: { kind: "appointment", data: a },
          };
        });

      const blocks: EventInput[] = data.blocks
        .filter((b) => !only || !b.dentistId || b.dentistId === only)
        .map((b) => ({
          id: `b:${b.id}`,
          title: b.reason ?? "Bloqueado",
          start: toCalendarDate(b.startAt),
          end: toCalendarDate(b.endAt),
          editable: false,
          classNames: ["fc-event-block"],
          extendedProps: { kind: "block", data: b },
        }));

      return [...blocks, ...appointments];
    },
    [dentistById]
  );

  const refetch = useCallback(() => calendarRef.current?.getApi().refetchEvents(), []);

  function handleSaved(message?: string) {
    setDraft(null);
    setSelected(null);
    if (message) setNotice({ type: "ok", text: message });
    refetch();
  }

  function openCreate(start: Date, end: Date) {
    setNotice(null);
    setDraft({
      start: calendarDateToInput(start),
      end: calendarDateToInput(end),
      dentistId: filterRef.current || null,
      mode: "appointment",
    });
  }

  function handleSelect(info: DateSelectArg) {
    let end = info.end;
    // Clique num dia da visão mensal: sugere o primeiro horário da manhã.
    if (info.allDay) {
      const day = calendarDateToInput(info.start).slice(0, 10);
      const start = new Date(`${day}T${slotMinTime}:00Z`);
      start.setUTCHours(start.getUTCHours() + 1);
      end = new Date(start.getTime() + slotDurationMinutes * 60_000);
      openCreate(start, end);
    } else {
      openCreate(info.start, end);
    }
    calendarRef.current?.getApi().unselect();
  }

  function handleNewButton() {
    const now = new Date(`${toBrazilLocalInput(new Date())}:00Z`);
    const minutes = now.getUTCMinutes();
    now.setUTCMinutes(minutes - (minutes % 30) + 30, 0, 0);
    openCreate(now, new Date(now.getTime() + slotDurationMinutes * 60_000));
  }

  function handleClick(info: EventClickArg) {
    setNotice(null);
    setSelected(info.event.extendedProps as Selected);
  }

  async function handleChange(info: EventChangeArg) {
    const props = info.event.extendedProps as Selected;
    if (props.kind !== "appointment" || !info.event.start || !info.event.end) {
      info.revert();
      return;
    }
    const res = await fetch(`/api/appointments/${props.data.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startAt: fromCalendarDate(info.event.start).toISOString(),
        endAt: fromCalendarDate(info.event.end).toISOString(),
      }),
    });
    if (!res.ok) {
      info.revert();
      setNotice({ type: "error", text: await readError(res, "Não foi possível remarcar") });
      return;
    }
    setNotice({ type: "ok", text: `Consulta de ${props.data.patientName} remarcada.` });
    refetch();
  }

  function renderEvent(arg: EventContentArg) {
    const props = arg.event.extendedProps as Selected;
    if (props.kind === "block") {
      const scope = props.data.dentistId
        ? dentistById.get(props.data.dentistId)?.name ?? ""
        : "Clínica inteira";
      return (
        <div className="flex h-full flex-col overflow-hidden px-1 py-0.5 text-[11px] leading-tight">
          <span className="flex items-center gap-1 font-semibold">
            <Lock className="h-3 w-3 shrink-0" />
            <span className="truncate">{arg.event.title}</span>
          </span>
          <span className="truncate opacity-80">{scope}</span>
        </div>
      );
    }
    const a = props.data;
    return (
      <div className="flex h-full flex-col overflow-hidden px-1 py-0.5 text-[11px] leading-tight">
        <span className="truncate font-semibold">
          {arg.timeText && <span className="mr-1 font-normal opacity-90">{arg.timeText}</span>}
          {a.patientName}
        </span>
        {a.serviceName && <span className="truncate opacity-90">{a.serviceName}</span>}
        <span className="truncate opacity-80">{dentistById.get(a.dentistId)?.name}</span>
      </div>
    );
  }

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          aria-label="Filtrar por profissional"
          className={`${selectClass} w-full sm:w-64`}
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            filterRef.current = e.target.value;
            refetch();
          }}
        >
          <option value="">Todos os profissionais</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <Button onClick={handleNewButton} className="sm:ml-auto">
          <Plus className="mr-1 h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {dentists.map((d) => (
          <span key={d.id} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
            {d.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="fc-legend-block h-2.5 w-2.5 rounded-full" />
          Bloqueio
        </span>
      </div>

      {notice && (
        <p
          role={notice.type === "error" ? "alert" : "status"}
          className={`rounded-md px-3 py-2 text-sm ${
            notice.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="agenda-calendar rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          locale={ptBrLocale}
          timeZone="UTC"
          initialView={isMobile ? "timeGridDay" : "timeGridWeek"}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          height="auto"
          allDaySlot={false}
          nowIndicator
          now={() => toCalendarDate(new Date())}
          slotDuration={{ minutes: slotDurationMinutes }}
          snapDuration={{ minutes: 15 }}
          slotMinTime={slotMinTime}
          slotMaxTime={slotMaxTime}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit" }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit" }}
          businessHours={businessHours}
          dayMaxEvents={3}
          selectable
          selectMirror
          editable
          eventDurationEditable
          events={fetchEvents}
          eventContent={renderEvent}
          select={handleSelect}
          eventClick={handleClick}
          eventChange={handleChange}
          eventSourceFailure={(err) => setNotice({ type: "error", text: err.message })}
        />
      </div>

      <CreateDialog
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={handleSaved}
        dentists={dentists}
        patients={patients}
        services={services}
        slotDurationMinutes={slotDurationMinutes}
        ownDentistId={ownDentistId}
      />
      <DetailsDialog
        selected={selected}
        onClose={() => setSelected(null)}
        onChanged={handleSaved}
        dentists={dentists}
        ownDentistId={ownDentistId}
      />
    </div>
  );
}
