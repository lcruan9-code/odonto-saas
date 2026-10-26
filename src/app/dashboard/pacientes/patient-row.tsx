"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Patient = {
  id: string;
  name: string;
  notes: string | null;
  contacts: { value: string }[];
};

export function PatientRow({ patient }: { patient: Patient }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(patient.name);
  const [notes, setNotes] = useState(patient.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, notes }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  return (
    <>
      <tr className="border-t align-top">
        <td className="p-3">{patient.name}</td>
        <td className="p-3">{patient.contacts.map((c) => c.value).join(", ") || "—"}</td>
        <td className="p-3">
          <button
            onClick={() => setEditing((v) => !v)}
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
          >
            Editar
          </button>
        </td>
      </tr>
      {editing && (
        <tr className="border-t bg-slate-50">
          <td colSpan={3} className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs">
                Nome
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded border p-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                Observações
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded border p-2 text-sm"
                />
              </label>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </td>
        </tr>
      )}
    </>
  );
}
