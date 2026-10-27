"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const WEEK = [
  { key: "MONDAY", label: "Segunda", short: "Seg" },
  { key: "TUESDAY", label: "Terça", short: "Ter" },
  { key: "WEDNESDAY", label: "Quarta", short: "Qua" },
  { key: "THURSDAY", label: "Quinta", short: "Qui" },
  { key: "FRIDAY", label: "Sexta", short: "Sex" },
  { key: "SATURDAY", label: "Sábado", short: "Sáb" },
  { key: "SUNDAY", label: "Domingo", short: "Dom" },
] as const;

export type DayKey = (typeof WEEK)[number]["key"];

export type ScheduleDay = {
  dayOfWeek: DayKey;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
};

export type ScheduleRecord = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isActive: boolean;
};

/** Grade completa (7 dias) para o editor, a partir do que está salvo. */
export function toEditorSchedule(records: ScheduleRecord[] | null): ScheduleDay[] {
  return WEEK.map(({ key }) => {
    const saved = records?.find((r) => r.dayOfWeek === key);
    if (saved) {
      return {
        dayOfWeek: key,
        enabled: saved.isActive,
        startTime: saved.startTime,
        endTime: saved.endTime,
        breakStart: saved.breakStart ?? "",
        breakEnd: saved.breakEnd ?? "",
      };
    }
    // Profissional novo: sugere segunda a sexta, 08h às 18h com almoço.
    const weekday = records === null && key !== "SATURDAY" && key !== "SUNDAY";
    return {
      dayOfWeek: key,
      enabled: weekday,
      startTime: "08:00",
      endTime: "18:00",
      breakStart: weekday ? "12:00" : "",
      breakEnd: weekday ? "13:00" : "",
    };
  });
}

/** Payload da API: só os dias com expediente. */
export function toSchedulePayload(days: ScheduleDay[]) {
  return days
    .filter((d) => d.enabled)
    .map((d) => ({
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      breakStart: d.breakStart || null,
      breakEnd: d.breakEnd || null,
      isActive: true,
    }));
}

/** Mensagem de erro do primeiro dia inválido, ou null. */
export function validateSchedule(days: ScheduleDay[]) {
  for (const d of days) {
    if (!d.enabled) continue;
    const label = WEEK.find((w) => w.key === d.dayOfWeek)!.label;
    if (!d.startTime || !d.endTime || d.startTime >= d.endTime) {
      return `${label}: o fim do expediente precisa ser depois do início.`;
    }
    if (!d.breakStart !== !d.breakEnd) {
      return `${label}: informe início e fim do intervalo, ou deixe os dois vazios.`;
    }
    if (
      d.breakStart &&
      !(d.startTime < d.breakStart && d.breakStart < d.breakEnd && d.breakEnd < d.endTime)
    ) {
      return `${label}: o intervalo precisa estar dentro do expediente.`;
    }
  }
  return null;
}

export function ScheduleEditor({
  value,
  onChange,
  disabled,
}: {
  value: ScheduleDay[];
  onChange: (days: ScheduleDay[]) => void;
  disabled?: boolean;
}) {
  function update(index: number, patch: Partial<ScheduleDay>) {
    onChange(value.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function copyMondayToWeekdays() {
    const monday = value[0];
    onChange(
      value.map((d, i) => (i > 0 && i < 5 ? { ...monday, dayOfWeek: d.dayOfWeek } : d))
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Dias e horários em que o profissional atende. O intervalo é opcional.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={copyMondayToWeekdays}
          disabled={disabled || !value[0]?.enabled}
          title="Aplicar o horário de segunda de terça a sexta"
        >
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          Repetir segunda
        </Button>
      </div>

      <div className="divide-y rounded-lg border">
        {value.map((day, index) => {
          const meta = WEEK[index];
          return (
            <div key={day.dayOfWeek} className="space-y-2 p-3" data-day={day.dayOfWeek}>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={day.enabled}
                  disabled={disabled}
                  onChange={(e) => update(index, { enabled: e.target.checked })}
                />
                {meta.label}
                {!day.enabled && (
                  <span className="text-xs font-normal text-muted-foreground">Não atende</span>
                )}
              </label>
              {day.enabled && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <TimeField
                    label="Início"
                    value={day.startTime}
                    disabled={disabled}
                    onChange={(v) => update(index, { startTime: v })}
                    required
                  />
                  <TimeField
                    label="Fim"
                    value={day.endTime}
                    disabled={disabled}
                    onChange={(v) => update(index, { endTime: v })}
                    required
                  />
                  <TimeField
                    label="Intervalo de"
                    value={day.breakStart}
                    disabled={disabled}
                    onChange={(v) => update(index, { breakStart: v })}
                  />
                  <TimeField
                    label="até"
                    value={day.breakEnd}
                    disabled={disabled}
                    onChange={(v) => update(index, { breakEnd: v })}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  disabled,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <Input
        type="time"
        step={300}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    </label>
  );
}
