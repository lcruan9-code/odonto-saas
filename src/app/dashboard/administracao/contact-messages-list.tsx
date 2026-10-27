"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Message = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  createdAt: string;
};

export function ContactMessagesList({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function remove(id: string) {
    setRemovingId(id);
    await fetch(`/api/contact-messages/${id}`, { method: "DELETE" });
    setRemovingId(null);
    router.refresh();
  }

  if (messages.length === 0) {
    return (
      <div className="max-w-lg rounded-md border bg-white p-4 text-sm text-slate-500">
        Nenhuma mensagem recebida pelo formulário de contato do site ainda.
      </div>
    );
  }

  return (
    <ul className="flex max-w-lg flex-col gap-3">
      {messages.map((m) => (
        <li key={m.id} className="rounded-md border bg-white p-4 text-sm">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-slate-500">
                {[m.email, m.phone].filter(Boolean).join(" · ") || "sem contato informado"} ·{" "}
                {new Date(m.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <button
              onClick={() => remove(m.id)}
              disabled={removingId === m.id}
              className="shrink-0 rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Remover
            </button>
          </div>
          <p className="text-slate-700">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}
