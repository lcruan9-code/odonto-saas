"use client";

import { useState } from "react";

export function ContactForm({ clinicId, primary }: { clinicId: string; primary: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    const res = await fetch("/api/public/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clinicId, name, email, phone, message, website }),
    });

    if (res.ok) {
      setStatus("done");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } else {
      const data = await res.json();
      setStatus("error");
      setError(typeof data.error === "string" ? data.error : "Não foi possível enviar.");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-xl bg-green-50 p-4 text-green-700">
        Mensagem enviada! A clínica vai entrar em contato em breve.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome"
        className="rounded-xl border p-3"
        required
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail (opcional)"
          className="rounded-xl border p-3"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Telefone (opcional)"
          className="rounded-xl border p-3"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Como podemos ajudar?"
        rows={4}
        className="rounded-xl border p-3"
        required
      />
      {status === "error" && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: primary }}
      >
        {status === "loading" ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
