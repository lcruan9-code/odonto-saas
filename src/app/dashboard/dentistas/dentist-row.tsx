"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Dentist = {
  id: string;
  active: boolean;
  publicVisible: boolean;
  publicBio: string | null;
  photoUrl: string | null;
  specialty: string | null;
  cro: string | null;
  user: { name: string; email: string };
};

export function DentistRow({ dentist }: { dentist: Dentist }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(dentist.publicBio ?? "");
  const [photoUrl, setPhotoUrl] = useState(dentist.photoUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/dentists/${dentist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Não foi possível salvar. Verifique a URL da foto.");
      return false;
    }
    router.refresh();
    return true;
  }

  return (
    <>
      <tr className="border-t align-top">
        <td className="p-3">
          <div className="flex items-center gap-2">
            {dentist.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dentist.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">
                {dentist.user.name.replace(/^Dr[a]?\.\s*/, "").charAt(0)}
              </span>
            )}
            <span className="font-medium">{dentist.user.name}</span>
          </div>
        </td>
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
              Perfil público
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
              <label className="flex w-full max-w-md flex-col gap-1 text-xs">
                Foto (URL http(s):// ou caminho local, ex: /images/demo/dentista-ana.jpg)
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="rounded border p-2 text-sm"
                />
              </label>
              <button
                onClick={() =>
                  patch({ publicBio: bio, photoUrl }).then((ok) => ok && setEditingBio(false))
                }
                disabled={saving}
                className="rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Salvar perfil
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </td>
        </tr>
      )}
    </>
  );
}
