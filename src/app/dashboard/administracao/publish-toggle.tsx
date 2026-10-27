"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PublishToggle({
  slug,
  initialPublished,
  canEdit,
}: {
  slug: string;
  initialPublished: boolean;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [published, setPublished] = useState(initialPublished);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/clinic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    setPublished((v) => !v);
    router.refresh();
  }

  return (
    <div className="flex max-w-lg flex-col gap-3 rounded-md border bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">
            Site público:{" "}
            <span className={published ? "text-green-700" : "text-slate-500"}>
              {published ? "Publicado" : "Não publicado"}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            Enquanto não publicado, só administradores logados veem a prévia.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={toggle}
            disabled={saving}
            className="rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {published ? "Despublicar" : "Publicar"}
          </button>
        )}
      </div>
      <a
        href={`/clinica/${slug}`}
        target="_blank"
        rel="noreferrer"
        className="text-sm text-primary underline"
      >
        Ver página pública / prévia →
      </a>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
