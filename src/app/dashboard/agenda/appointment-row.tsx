"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDateTime, fromBrazilLocalInput, toBrazilLocalInput } from "@/lib/dates";

type Dentist = { id: string; name: string };

type Appointment = {
  id: string;
  startAt: string;
  status: string;
  patient: { name: string };
  dentist: { id: string; user: { name: string } };
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Agendado",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  COMPLETED: "Concluído",
  NO_SHOW: "Faltou",
};

export function AppointmentRow({
  appointment,
  dentists,
  slotDurationMinutes,
}: {
  appointment: Appointment;
  dentists: Dentist[];
  slotDurationMinutes: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [dentistId, setDentistId] = useState(appointment.dentist.id);
  const [startAt, setStartAt] = useState(toBrazilLocalInput(appointment.startAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return false;
    }
    router.refresh();
    return true;
  }

  async function handleStatusChange(status: string) {
    await patch({ status });
  }

  async function handleReschedule() {
    const start = fromBrazilLocalInput(startAt);
    const end = new Date(start.getTime() + slotDurationMinutes * 60_000);
    const ok = await patch({
      dentistId,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    });
    if (ok) setEditing(false);
  }

  async function handleCancel() {
    if (!confirm("Cancelar este agendamento?")) return;
    await patch({ status: "CANCELLED" });
  }

  return (
    <>
      <tr className="border-t align-top">
        <td className="p-3">
          {formatDateTime(appointment.startAt)}
        </td>
        <td className="p-3">{appointment.patient.name}</td>
        <td className="p-3">{appointment.dentist.user.name}</td>
        <td className="p-3">
          <select
            value={appointment.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={saving}
            className="rounded border p-1 text-sm"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </td>
        <td className="p-3">
          <div className="flex gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
            >
              Reagendar
            </button>
            <button
              onClick={handleCancel}
              disabled={appointment.status === "CANCELLED"}
              className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-t bg-slate-50">
          <td colSpan={5} className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs">
                Dentista
                <select
                  value={dentistId}
                  onChange={(e) => setDentistId(e.target.value)}
                  className="rounded border p-2 text-sm"
                >
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Novo horário
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="rounded border p-2 text-sm"
                />
              </label>
              <button
                onClick={handleReschedule}
                disabled={saving}
                className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Salvar
              </button>
              <button
                onClick={() => setEditing(false)}
                className="rounded border px-3 py-2 text-sm hover:bg-slate-100"
              >
                Cancelar edição
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </td>
        </tr>
      )}
    </>
  );
}
