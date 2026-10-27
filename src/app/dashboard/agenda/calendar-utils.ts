import { fromBrazilLocalInput, toBrazilLocalInput } from "@/lib/dates";

// O FullCalendar roda com timeZone "UTC" e recebe datas "flutuantes" já no
// horário de Brasília. Assim a grade mostra sempre o horário da clínica,
// independente do fuso do navegador de quem acessa o painel.
export function toCalendarDate(value: string | Date) {
  return `${toBrazilLocalInput(value)}:00`;
}

/** Date devolvido pelo calendário (campos UTC = horário de Brasília) -> instante real. */
export function fromCalendarDate(date: Date) {
  return fromBrazilLocalInput(date.toISOString().slice(0, 16));
}

/** Date devolvido pelo calendário -> valor de <input type="datetime-local">. */
export function calendarDateToInput(date: Date) {
  return date.toISOString().slice(0, 16);
}

export type AgendaDentist = {
  id: string;
  name: string;
  color: string;
  schedules: { dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }[];
};

export type AgendaOption = { id: string; name: string };

export type AgendaAppointment = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  notes: string | null;
  dentistId: string;
  serviceId: string | null;
  serviceName: string | null;
  patientId: string;
  patientName: string;
  patientPhone: string | null;
};

export type AgendaBlock = {
  id: string;
  startAt: string;
  endAt: string;
  reason: string | null;
  dentistId: string | null;
};

export { whatsappLink } from "@/lib/whatsapp";

export async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (typeof data.error === "string") return data.error;
    const field = data.error?.fieldErrors && Object.values(data.error.fieldErrors)[0];
    if (Array.isArray(field) && typeof field[0] === "string") return field[0];
  } catch {
    // resposta sem JSON
  }
  return fallback;
}
