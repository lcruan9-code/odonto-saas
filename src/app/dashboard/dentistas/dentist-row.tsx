"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Dentist = {
  id: string;
  active: boolean;
  specialty: string | null;
  cro: string | null;
  user: { name: string; email: string };
};

export function DentistRow({ dentist }: { dentist: Dentist }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function toggleActive() {
    setSaving(true);
    await fetch(`/api/dentists/${dentist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !dentist.active }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <tr className="border-t">
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
        <button
          onClick={toggleActive}
          disabled={saving}
          className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
        >
          {dentist.active ? "Desativar" : "Ativar"}
        </button>
      </td>
    </tr>
  );
}
