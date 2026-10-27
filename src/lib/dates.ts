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
