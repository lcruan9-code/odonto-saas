"use client";

import { useState } from "react";
import { formatDateTime, formatTime } from "@/lib/dates";
import { CheckIcon } from "@/components/dental-icons";
import { whiteLabel } from "@/config/white-label";

type Dentist = { id: string; name: string; specialty?: string | null };

function todayInBrazil() {
  return new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10);
}

function StepTitle({ n, title, color }: { n: number; title: string; color: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm text-white"
        style={{ backgroundColor: color }}
      >
        {n}
      </span>
      {title}
    </h2>
  );
}

export function BookingForm({
  clinicId,
  dentists,
  primary = whiteLabel.colors.primary,
  photos = {},
  homeHref,
}: {
  clinicId: string;
  dentists: Dentist[];
  primary?: string;
  photos?: Record<string, string | null>;
  homeHref?: string;
}) {
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function loadSlots(nextDentistId: string, nextDate: string) {
    if (!nextDentistId || !nextDate) return;
    setLoadingSlots(true);
    const res = await fetch(
      `/api/public/availability?clinicId=${clinicId}&dentistId=${nextDentistId}&date=${nextDate}`
    );
    const data = await res.json();
    setSlots(data.slots ?? []);
    setSelectedSlot("");
    setLoadingSlots(false);
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
    } else {
      const data = await res.json();
      setStatus("error");
      setMessage(typeof data.error === "string" ? data.error : "Não foi possível agendar.");
      if (res.status === 409) loadSlots(dentistId, date);
    }
  }

  const dentist = dentists.find((d) => d.id === dentistId);

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h2 className="text-xl font-bold">Consulta agendada!</h2>
        <p className="text-slate-600">
          {dentist?.name} · {formatDateTime(selectedSlot, { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p className="text-sm text-slate-500">
          A clínica vai confirmar pelo WhatsApp informado ({contact}).
        </p>
        {homeHref && (
          <a href={homeHref} className="mt-2 text-sm font-medium underline" style={{ color: primary }}>
            Voltar ao site da clínica
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section>
        <StepTitle n={1} title="Escolha o profissional" color={primary} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {dentists.map((d) => {
            const selected = d.id === dentistId;
            const photo = photos[d.id];
            return (
              <button
                type="button"
                key={d.id}
                onClick={() => {
                  setDentistId(d.id);
                  loadSlots(d.id, date);
                }}
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  selected ? "border-transparent ring-2" : "border-slate-200 hover:border-slate-300"
                }`}
                style={selected ? ({ "--tw-ring-color": primary } as React.CSSProperties) : undefined}
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold text-white"
                    style={{ backgroundColor: primary }}
                  >
                    {d.name.replace(/^Dr[a]?\.\s*/, "").charAt(0)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">{d.name}</span>
                  {d.specialty && (
                    <span className="block truncate text-xs text-slate-500">{d.specialty}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <StepTitle n={2} title="Escolha dia e horário" color={primary} />
        <input
          type="date"
          value={date}
          min={todayInBrazil()}
          onChange={(e) => {
            setDate(e.target.value);
            loadSlots(dentistId, e.target.value);
          }}
          className="w-full rounded-xl border border-slate-300 p-3 sm:w-auto"
          required
          aria-label="Data da consulta"
        />

        {date && (
          <div className="mt-4">
            {loadingSlots ? (
              <p className="text-sm text-slate-500">Buscando horários livres…</p>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                Nenhum horário disponível neste dia. Tente outra data ou outro profissional.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {slots.map((slot) => {
                  const selected = selectedSlot === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      aria-pressed={selected}
                      className={`rounded-full border py-2 text-sm font-medium transition ${
                        selected ? "border-transparent text-white" : "border-slate-200 bg-white hover:border-slate-400"
                      }`}
                      style={selected ? { backgroundColor: primary } : undefined}
                    >
                      {formatTime(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <StepTitle n={3} title="Seus dados" color={primary} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Nome completo
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
              autoComplete="name"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            WhatsApp
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="rounded-xl border border-slate-300 p-3"
              placeholder="(11) 99999-0000"
              inputMode="tel"
              autoComplete="tel"
              required
            />
          </label>
        </div>
      </section>

      {selectedSlot && dentist && (
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          Resumo: <strong>{dentist.name}</strong> em{" "}
          <strong>{formatDateTime(selectedSlot, { dateStyle: "full", timeStyle: "short" })}</strong>
        </p>
      )}

      {status === "error" && <p className="text-sm text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={!selectedSlot || status === "loading"}
        className="rounded-full py-3.5 font-semibold text-white shadow-md transition disabled:opacity-40"
        style={{ backgroundColor: primary }}
      >
        {status === "loading" ? "Agendando..." : "Confirmar agendamento"}
      </button>
    </form>
  );
}
