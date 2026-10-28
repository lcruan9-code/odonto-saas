"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { whiteLabel } from "@/config/white-label";
import { ImageUpload } from "@/components/image-upload";
import { useSyncPreview } from "./preview-context";

type Branding = {
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  aboutImageUrl: string | null;
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
  const [aboutImageUrl, setAboutImageUrl] = useState(branding.aboutImageUrl ?? "");
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor ?? whiteLabel.colors.primary);
  const [secondaryColor, setSecondaryColor] = useState(
    branding.secondaryColor ?? whiteLabel.colors.secondary
  );
  const [accentColor, setAccentColor] = useState(branding.accentColor ?? whiteLabel.colors.accent);
  const [ctaText, setCtaText] = useState(branding.ctaText ?? "Agende sua Consulta");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useSyncPreview({
    description,
    logoUrl,
    coverImageUrl,
    aboutImageUrl,
    primaryColor,
    secondaryColor,
    accentColor,
    ctaText,
  });

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
        aboutImageUrl,
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
      className="flex flex-col gap-4 rounded-md border bg-white p-4"
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
      <ImageUpload
        id="logo-url"
        label="Logo"
        hint="Quadrado, de preferência com fundo transparente (PNG)."
        aspect="square"
        maxSide={512}
        value={logoUrl}
        onChange={setLogoUrl}
        disabled={!canEdit}
      />
      <ImageUpload
        id="cover-url"
        label="Imagem de capa"
        hint="Aparece no topo do site, ao lado do nome da clínica."
        value={coverImageUrl}
        onChange={setCoverImageUrl}
        disabled={!canEdit}
      />
      <ImageUpload
        id="about-url"
        label='Imagem da seção "Como funciona"'
        hint="Ex.: foto do consultório ou da recepção."
        value={aboutImageUrl}
        onChange={setAboutImageUrl}
        disabled={!canEdit}
      />
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
        As alterações aparecem na prévia ao lado na hora; o site só muda depois de salvar.
      </p>
    </form>
  );
}
