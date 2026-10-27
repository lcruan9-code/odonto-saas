"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Dentist = {
  id: string;
  active: boolean;
  publicVisible: boolean;
  publicBio: string | null;
  specialty: string | null;
  cro: string | null;
  user: { name: string; email: string };
};

export function DentistRow({ dentist }: { dentist: Dentist }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(dentist.publicBio ?? "");

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    await fetch(`/api/dentists/${dentist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <>
      <tr className="border-t align-top">
        <td className="p-3">{dentist.user.name}</td>
        <td className="p-3">{dentist.user.email}</td>
        <td className="p-3">{dentist.specialty || "—"}</td>
        <td className="p-3">{dentist.cro || "—"}</td>
        <td className="p-3">
          <span
            className={`rounded px-2 py-1 text-xs ${
              dentist.active ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {dentist.active ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td className="p-3">
          <span
            className={`rounded px-2 py-1 text-xs ${
              dentist.publicVisible ? "bg-sky-100 text-sky-700" : "bg-slate-200 text-slate-600"
            }`}
          >
            {dentist.publicVisible ? "Visível" : "Oculto"}
          </span>
        </td>
        <td className="p-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => patch({ active: !dentist.active })}
              disabled={saving}
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
            >
              {dentist.active ? "Desativar" : "Ativar"}
            </button>
            <button
              onClick={() => patch({ publicVisible: !dentist.publicVisible })}
              disabled={saving}
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
            >
              {dentist.publicVisible ? "Ocultar do site" : "Mostrar no site"}
            </button>
            <button
              onClick={() => setEditingBio((v) => !v)}
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
            >
              Bio pública
            </button>
          </div>
        </td>
      </tr>
      {editingBio && (
        <tr className="border-t bg-slate-50">
          <td colSpan={7} className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex w-full max-w-md flex-col gap-1 text-xs">
                Bio pública (aparece na home da clínica)
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  className="rounded border p-2 text-sm"
                />
              </label>
              <button
                onClick={() => patch({ publicBio: bio }).then(() => setEditingBio(false))}
                disabled={saving}
                className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Salvar bio
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
