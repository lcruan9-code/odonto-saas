"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Option = { id: string; name: string };

export function NewAppointmentForm({
  patients,
  dentists,
  slotDurationMinutes,
}: {
  patients: Option[];
  dentists: Option[];
  slotDurationMinutes: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "");
  const [startAt, setStartAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const start = new Date(startAt);
    const end = new Date(start.getTime() + slotDurationMinutes * 60_000);

    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId,
        dentistId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao agendar");
      return;
    }

    setOpen(false);
    setStartAt("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Novo agendamento
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-xs">
        Paciente
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="rounded border p-2 text-sm"
          required
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Dentista
        <select
          value={dentistId}
          onChange={(e) => setDentistId(e.target.value)}
          className="rounded border p-2 text-sm"
          required
        >
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Data/hora
        <input
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="rounded border p-2 text-sm"
          required
        />
      </label>

      <button
        type="submit"
        disabled={saving || !patientId || !dentistId}
        className="rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Agendando..." : "Agendar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="rounded border px-4 py-2 text-sm hover:bg-slate-100"
      >
        Cancelar
      </button>

      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
