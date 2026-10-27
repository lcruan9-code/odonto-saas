"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  order: number;
};

export function ServicesManager({
  services,
  canEdit,
}: {
  services: Service[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, order: services.length }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Erro ao salvar");
      return;
    }
    setName("");
    setDescription("");
    router.refresh();
  }

  async function toggleActive(service: Service) {
    await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !service.active }),
    });
    router.refresh();
  }

  async function remove(service: Service) {
    if (!confirm(`Remover o serviço "${service.name}"?`)) return;
    await fetch(`/api/services/${service.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function move(service: Service, direction: -1 | 1) {
    const sorted = [...services].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((s) => s.id === service.id);
    const swapWith = sorted[index + direction];
    if (!swapWith) return;

    await Promise.all([
      fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapWith.order }),
      }),
      fetch(`/api/services/${swapWith.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: service.order }),
      }),
    ]);
    router.refresh();
  }

  return (
    <div className="max-w-lg rounded-md border bg-white p-4">
      {canEdit && (
        <form onSubmit={handleCreate} className="mb-4 flex flex-col gap-2 border-b pb-4">
          <label className="flex flex-col gap-1 text-sm">
            Novo serviço
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do serviço"
              className="rounded border p-2"
              required
            />
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrição (opcional)"
            className="rounded border p-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Adicionar serviço
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      )}

      <ul className="flex flex-col gap-2">
        {services.map((service, i) => (
          <li
            key={service.id}
            className="flex items-center justify-between gap-2 rounded border p-2 text-sm"
          >
            <div>
              <p className={service.active ? "font-medium" : "font-medium text-slate-400"}>
                {service.name}
              </p>
              {service.description && (
                <p className="text-xs text-slate-500">{service.description}</p>
              )}
            </div>
            {canEdit && (
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => move(service, -1)}
                  disabled={i === 0}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(service, 1)}
                  disabled={i === services.length - 1}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  onClick={() => toggleActive(service)}
                  className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
                >
                  {service.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => remove(service)}
                  className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remover
                </button>
              </div>
            )}
          </li>
        ))}
        {services.length === 0 && (
          <li className="text-sm text-slate-500">Nenhum serviço cadastrado.</li>
        )}
      </ul>
    </div>
  );
}
