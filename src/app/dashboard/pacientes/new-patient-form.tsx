"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewPatientForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactType, setContactType] = useState<"WHATSAPP" | "PHONE" | "EMAIL">("WHATSAPP");
  const [contactValue, setContactValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        contacts: contactValue
          ? [{ type: contactType, value: contactValue, isPrimary: true }]
          : undefined,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao cadastrar");
      return;
    }

    setOpen(false);
    setName("");
    setContactValue("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Novo paciente
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-wrap items-end gap-3 rounded-md border bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-xs">
        Nome
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border p-2 text-sm"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Tipo de contato
        <select
          value={contactType}
          onChange={(e) => setContactType(e.target.value as typeof contactType)}
          className="rounded border p-2 text-sm"
        >
          <option value="WHATSAPP">WhatsApp</option>
          <option value="PHONE">Telefone</option>
          <option value="EMAIL">E-mail</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        Contato
        <input
          value={contactValue}
          onChange={(e) => setContactValue(e.target.value)}
          className="rounded border p-2 text-sm"
          placeholder="(11) 99999-0000"
        />
      </label>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
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
