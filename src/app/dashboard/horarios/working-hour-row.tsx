"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WorkingHourRow({
  dayOfWeek,
  label,
  initialStartTime,
  initialEndTime,
  initialActive,
  canEdit,
}: {
  dayOfWeek: string;
  label: string;
  initialStartTime: string;
  initialEndTime: string;
  initialActive: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [isActive, setIsActive] = useState(initialActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, startTime, endTime, isActive }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    router.refresh();
  }

  return (
    <tr className="border-t">
      <td className="p-3">{label}</td>
      <td className="p-3">
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={!canEdit}
          className="rounded border p-1 text-sm disabled:bg-slate-100"
        />
      </td>
      <td className="p-3">
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={!canEdit}
          className="rounded border p-1 text-sm disabled:bg-slate-100"
        />
      </td>
      <td className="p-3">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={!canEdit}
        />
      </td>
      {canEdit && (
        <td className="p-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      )}
    </tr>
  );
}
