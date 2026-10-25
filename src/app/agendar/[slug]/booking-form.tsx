"use client";

import { useState } from "react";

type Dentist = { id: string; name: string; specialty?: string | null };

export function BookingForm({ clinicId, dentists }: { clinicId: string; dentists: Dentist[] }) {
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function loadSlots(nextDentistId: string, nextDate: string) {
    if (!nextDentistId || !nextDate) return;
    const res = await fetch(
      `/api/public/availability?clinicId=${clinicId}&dentistId=${nextDentistId}&date=${nextDate}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setSelectedSlot("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/public/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicId,
        dentistId,
        startAt: selectedSlot,
        patientName: name,
        contactType: "WHATSAPP",
        contactValue: contact,
      }),
    });

    if (res.ok) {
      setStatus("done");
      setMessage("Agendamento confirmado! Você receberá uma confirmação em breve.");
    } else {
      const data = await res.json();
      setStatus("error");
      setMessage(typeof data.error === "string" ? data.error : "Não foi possível agendar.");
    }
  }

  if (status === "done") {
    return <p className="rounded bg-green-50 p-4 text-green-700">{message}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Dentista
        <select
          value={dentistId}
          onChange={(e) => {
            setDentistId(e.target.value);
            loadSlots(e.target.value, date);
          }}
          className="rounded border p-2"
        >
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
              {d.specialty ? ` — ${d.specialty}` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Data
        <input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => {
            setDate(e.target.value);
            loadSlots(dentistId, e.target.value);
          }}
          className="rounded border p-2"
          required
        />
      </label>

      {date && (
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => (
            <button
              type="button"
              key={slot}
              onClick={() => setSelectedSlot(slot)}
              className={`rounded border px-3 py-1 text-sm ${
                selectedSlot === slot ? "bg-primary text-white" : "bg-white"
              }`}
            >
              {new Date(slot).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </button>
          ))}
          {slots.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum horário disponível neste dia.</p>
          )}
        </div>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Nome completo
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded border p-2"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        WhatsApp
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="rounded border p-2"
          placeholder="(11) 99999-0000"
          required
        />
      </label>

      {status === "error" && <p className="text-sm text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={!selectedSlot || status === "loading"}
        className="rounded bg-primary p-2 text-white disabled:opacity-50"
      >
        {status === "loading" ? "Agendando..." : "Confirmar agendamento"}
      </button>
    </form>
  );
}
