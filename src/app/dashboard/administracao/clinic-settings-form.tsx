"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Clinic = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  slotDurationMinutes: number;
};

export function ClinicSettingsForm({ clinic, canEdit }: { clinic: Clinic; canEdit: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(clinic.name);
  const [phone, setPhone] = useState(clinic.phone ?? "");
  const [email, setEmail] = useState(clinic.email ?? "");
  const [address, setAddress] = useState(clinic.address ?? "");
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(clinic.slotDurationMinutes);
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
      body: JSON.stringify({ name, phone, email, address, slotDurationMinutes }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    setMessage("Dados salvos.");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-lg flex-col gap-3 rounded-md border bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        Nome da clínica
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canEdit}
          className="rounded border p-2 disabled:bg-slate-100"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Telefone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!canEdit}
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!canEdit}
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Endereço
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={!canEdit}
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Duração padrão da consulta (minutos)
        <input
          type="number"
          min={5}
          max={240}
          value={slotDurationMinutes}
          onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
          disabled={!canEdit}
          className="rounded border p-2 disabled:bg-slate-100"
        />
      </label>

      {canEdit && (
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-primary p-2 text-white disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
      )}
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
