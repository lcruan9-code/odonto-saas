"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { fromBrazilLocalInput } from "@/lib/dates";
import { readError, type AgendaDentist, type AgendaOption } from "./calendar-utils";

export const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50";

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240];

export type CreateDraft = {
  /** "YYYY-MM-DDTHH:MM" em horário de Brasília */
  start: string;
  end: string;
  dentistId: string | null;
  mode: "appointment" | "block";
};

function addMinutes(local: string, minutes: number) {
  const d = new Date(`${local}:00Z`);
  return new Date(d.getTime() + minutes * 60_000).toISOString().slice(0, 16);
}

function diffMinutes(start: string, end: string) {
  return Math.round(
    (new Date(`${end}:00Z`).getTime() - new Date(`${start}:00Z`).getTime()) / 60_000
  );
}

export function CreateDialog({
  draft,
  onClose,
  onSaved,
  dentists,
  patients,
  services,
  slotDurationMinutes,
  ownDentistId,
}: {
  draft: CreateDraft | null;
  onClose: () => void;
  onSaved: (message?: string) => void;
  dentists: AgendaDentist[];
  patients: AgendaOption[];
  services: AgendaOption[];
  slotDurationMinutes: number;
  ownDentistId: string | null;
}) {
  const [mode, setMode] = useState<"appointment" | "block">("appointment");
  const [start, setStart] = useState("");
  const [duration, setDuration] = useState(slotDurationMinutes);
  const [dentistId, setDentistId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [newPatient, setNewPatient] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockScope, setBlockScope] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft) return;
    const minutes = Math.max(diffMinutes(draft.start, draft.end), 15);
    const fallbackDentist = ownDentistId ?? draft.dentistId ?? dentists[0]?.id ?? "";
    setMode(draft.mode);
    setStart(draft.start);
    setDuration(DURATIONS.includes(minutes) ? minutes : slotDurationMinutes);
    setDentistId(draft.dentistId ?? fallbackDentist);
    setServiceId("");
    setNotes("");
    setPatientQuery("");
    setPatientId("");
    setNewPatient(false);
    setNewPatientName("");
    setNewPatientPhone("");
    setBlockEnd(draft.end);
    setBlockScope(ownDentistId ?? draft.dentistId ?? "");
    setReason("");
    setError(null);
  }, [draft, dentists, ownDentistId, slotDurationMinutes]);

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    const list = q ? patients.filter((p) => p.name.toLowerCase().includes(q)) : patients;
    return list.slice(0, 50);
  }, [patients, patientQuery]);

  useEffect(() => {
    if (!filteredPatients.some((p) => p.id === patientId)) {
      setPatientId(filteredPatients[0]?.id ?? "");
    }
  }, [filteredPatients, patientId]);

  async function createAppointment() {
    let pid = patientId;
    if (newPatient) {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPatientName.trim(),
          contacts: newPatientPhone.trim()
            ? [{ type: "WHATSAPP", value: newPatientPhone.trim(), isPrimary: true }]
            : undefined,
        }),
      });
      if (!res.ok) throw new Error(await readError(res, "Não foi possível cadastrar o paciente"));
      pid = (await res.json()).id;
    }
    if (!pid) throw new Error("Selecione um paciente");

    const startAt = fromBrazilLocalInput(start);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: pid,
        dentistId,
        serviceId: serviceId || null,
        notes: notes.trim() || undefined,
        startAt: startAt.toISOString(),
        endAt: new Date(startAt.getTime() + duration * 60_000).toISOString(),
      }),
    });
    if (!res.ok) throw new Error(await readError(res, "Não foi possível agendar"));
  }

  async function createBlock() {
    const res = await fetch("/api/time-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dentistId: blockScope || null,
        startAt: fromBrazilLocalInput(start).toISOString(),
        endAt: fromBrazilLocalInput(blockEnd).toISOString(),
        reason: reason.trim() || undefined,
      }),
    });
    if (!res.ok) throw new Error(await readError(res, "Não foi possível bloquear o horário"));
    const data = await res.json();
    return data.overlappingAppointments as number;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === "appointment") {
        await createAppointment();
        onSaved("Consulta agendada.");
      } else {
        const overlapping = await createBlock();
        onSaved(
          overlapping > 0
            ? `Horário bloqueado. Atenção: ${overlapping} consulta(s) já marcada(s) nesse período precisam ser remarcadas.`
            : "Horário bloqueado."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  const appointmentEnd = start ? addMinutes(start, duration) : "";

  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo na agenda</DialogTitle>
          <DialogDescription>Agende uma consulta ou bloqueie um período.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="appointment">Agendamento</TabsTrigger>
              <TabsTrigger value="block">Bloqueio</TabsTrigger>
            </TabsList>

            <TabsContent value="appointment" className="space-y-4 pt-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Paciente</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => setNewPatient((v) => !v)}
                  >
                    {newPatient ? "Selecionar existente" : "+ Novo paciente"}
                  </button>
                </div>
                {newPatient ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Nome completo"
                      value={newPatientName}
                      onChange={(e) => setNewPatientName(e.target.value)}
                      required={mode === "appointment"}
                      minLength={2}
                    />
                    <Input
                      placeholder="WhatsApp (DDD + número)"
                      value={newPatientPhone}
                      onChange={(e) => setNewPatientPhone(e.target.value)}
                      inputMode="tel"
                    />
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input
                      placeholder="Buscar pelo nome"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                    />
                    <select
                      aria-label="Paciente"
                      className={selectClass}
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                    >
                      {filteredPatients.length === 0 && <option value="">Nenhum paciente</option>}
                      {filteredPatients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appt-dentist">Profissional</Label>
                  <select
                    id="appt-dentist"
                    className={selectClass}
                    value={dentistId}
                    onChange={(e) => setDentistId(e.target.value)}
                    required={mode === "appointment"}
                  >
                    {dentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appt-service">Serviço</Label>
                  <select
                    id="appt-service"
                    className={selectClass}
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                  >
                    <option value="">Não informado</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appt-start">Início</Label>
                  <Input
                    id="appt-start"
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appt-duration">Duração</Label>
                  <select
                    id="appt-duration"
                    className={selectClass}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {DURATIONS.map((m) => (
                      <option key={m} value={m}>
                        {m < 60 ? `${m} min` : `${m / 60}h${m % 60 ? ` ${m % 60}min` : ""}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {appointmentEnd && (
                <p className="text-xs text-muted-foreground">
                  Termina às {appointmentEnd.slice(11, 16)}.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="appt-notes">Observações</Label>
                <Textarea
                  id="appt-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="block" className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="block-scope">Agenda</Label>
                <select
                  id="block-scope"
                  className={selectClass}
                  value={blockScope}
                  onChange={(e) => setBlockScope(e.target.value)}
                  disabled={!!ownDentistId}
                >
                  {!ownDentistId && <option value="">Clínica inteira</option>}
                  {dentists
                    .filter((d) => !ownDentistId || d.id === ownDentistId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="block-start">Início</Label>
                  <Input
                    id="block-start"
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-end">Fim</Label>
                  <Input
                    id="block-end"
                    type="datetime-local"
                    value={blockEnd}
                    min={start}
                    onChange={(e) => setBlockEnd(e.target.value)}
                    required={mode === "block"}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-reason">Motivo</Label>
                <Input
                  id="block-reason"
                  placeholder="Ex.: Congresso, manutenção, almoço"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                />
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : mode === "appointment" ? "Agendar" : "Bloquear horário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
