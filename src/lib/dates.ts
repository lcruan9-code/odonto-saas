// Produto e clínicas são brasileiras; usamos um offset fixo de UTC-3 (Brasil
// não observa horário de verão desde 2019) para calcular "hoje" de forma
// consistente, em vez do horário do servidor (que na Vercel roda em UTC).
const BRAZIL_OFFSET_HOURS = 3;

export function getBrazilDayRange(reference: Date = new Date()) {
  const shifted = new Date(reference.getTime() - BRAZIL_OFFSET_HOURS * 60 * 60 * 1000);
  const startOfDayBrazil = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );

  const start = new Date(startOfDayBrazil + BRAZIL_OFFSET_HOURS * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

  return { start, end };
}

// "2026-10-27" + "08:30" no horário de Brasília -> instante UTC correspondente.
export function brazilDateTimeToUtc(date: string, hhmm: string) {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h + BRAZIL_OFFSET_HOURS, m));
}

export const CLINIC_TIME_ZONE = "America/Sao_Paulo";

// Sempre formata no fuso da clínica: o servidor (Vercel) roda em UTC e
// componentes client também renderizam no servidor antes da hidratação.
export function formatDateTime(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "short", timeStyle: "short" }
) {
  return new Date(value).toLocaleString("pt-BR", { timeZone: CLINIC_TIME_ZONE, ...options });
}

export function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    timeZone: CLINIC_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Valor para <input type="datetime-local"> ("YYYY-MM-DDTHH:MM") em horário de Brasília.
export function toBrazilLocalInput(value: Date | string) {
  const shifted = new Date(new Date(value).getTime() - BRAZIL_OFFSET_HOURS * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 16);
}

export function fromBrazilLocalInput(value: string) {
  const [date, time] = value.split("T");
  return brazilDateTimeToUtc(date, time);
}

// Dia da semana (0 = domingo) de uma data de calendário "YYYY-MM-DD".
export function weekdayOfDate(date: string) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}
