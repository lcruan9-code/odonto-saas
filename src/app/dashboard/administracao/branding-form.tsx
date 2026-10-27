"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Branding = {
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  ctaText: string | null;
};

export function BrandingForm({ branding, canEdit }: { branding: Branding; canEdit: boolean }) {
  const router = useRouter();
  const [description, setDescription] = useState(branding.description ?? "");
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(branding.coverImageUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor ?? "#0A2B4E");
  const [secondaryColor, setSecondaryColor] = useState(branding.secondaryColor ?? "#007A8A");
  const [accentColor, setAccentColor] = useState(branding.accentColor ?? "#3BBEB8");
  const [ctaText, setCtaText] = useState(branding.ctaText ?? "Agende sua Consulta");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const res = await fetch("/api/clinic", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        logoUrl,
        coverImageUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        ctaText,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    setMessage("Identidade visual salva.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-lg flex-col gap-3 rounded-md border bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        Descrição institucional (aparece na home pública)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!canEdit}
          maxLength={500}
          rows={3}
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        URL do logo
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          disabled={!canEdit}
          placeholder="https://..."
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        URL da imagem de capa
        <input
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          disabled={!canEdit}
          placeholder="https://..."
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Cor primária
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            disabled={!canEdit}
            className="h-10 rounded border disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cor secundária
          <input
            type="color"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
            disabled={!canEdit}
            className="h-10 rounded border disabled:bg-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Cor de destaque
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
            disabled={!canEdit}
            className="h-10 rounded border disabled:bg-slate-100"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Texto do botão de agendar
        <input
          value={ctaText}
          onChange={(e) => setCtaText(e.target.value)}
          disabled={!canEdit}
          maxLength={60}
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>

      {canEdit && (
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-primary p-2 text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar identidade visual"}
        </button>
      )}
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">
        Sem serviço de upload de imagens configurado neste projeto — informe URLs de imagens já
        hospedadas (ex: um serviço de armazenamento próprio da clínica).
      </p>
    </form>
  );
}
