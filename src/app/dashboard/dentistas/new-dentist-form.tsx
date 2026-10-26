"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewDentistForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cro, setCro] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/dentists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, specialty, cro }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao cadastrar dentista");
      return;
    }

    setOpen(false);
    setName("");
    setEmail("");
    setPassword("");
    setSpecialty("");
    setCro("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-primary px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Novo dentista
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
        E-mail (login)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border p-2 text-sm"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Senha inicial
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border p-2 text-sm"
          minLength={6}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        Especialidade
        <input
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
          className="rounded border p-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        CRO
        <input
          value={cro}
          onChange={(e) => setCro(e.target.value)}
          className="rounded border p-2 text-sm"
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
