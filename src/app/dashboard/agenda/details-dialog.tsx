"use client";

import { useEffect, useState } from "react";
import { Lock, MessageCircle } from "lucide-react";
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
import { formatDateTime, formatTime, fromBrazilLocalInput, toBrazilLocalInput } from "@/lib/dates";
import { StatusBadge, STATUS_LABELS } from "../status-badge";
import { selectClass } from "./create-dialog";
import {
  readError,
  whatsappLink,
  type AgendaAppointment,
  type AgendaBlock,
  type AgendaDentist,
} from "./calendar-utils";

export type Selected =
  | { kind: "appointment"; data: AgendaAppointment }
  | { kind: "block"; data: AgendaBlock };

function period(startAt: string, endAt: string) {
  const sameDay = toBrazilLocalInput(startAt).slice(0, 10) === toBrazilLocalInput(endAt).slice(0, 10);
  return sameDay
    ? `${formatDateTime(startAt, { dateStyle: "full" })}, ${formatTime(startAt)} às ${formatTime(endAt)}`
    : `${formatDateTime(startAt)} até ${formatDateTime(endAt)}`;
}

export function DetailsDialog({
  selected,
  onClose,
  onChanged,
  dentists,
  ownDentistId,
}: {
  selected: Selected | null;
  onClose: () => void;
  onChanged: (message?: string) => void;
  dentists: AgendaDentist[];
  ownDentistId: string | null;
}) {
  const [rescheduling, setRescheduling] = useState(false);
  const [start, setStart] = useState("");
  const [dentistId, setDentistId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRescheduling(false);
    setError(null);
    if (selected?.kind === "appointment") {
      setStart(toBrazilLocalInput(selected.data.startAt));
      setDentistId(selected.data.dentistId);
    }
  }, [selected]);

  const dentistName = (id: string | null) =>
    id ? dentists.find((d) => d.id === id)?.name ?? "Profissional" : "Clínica inteira";

  async function run(request: () => Promise<Response>, fallback: string, message: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await request();
      if (!res.ok) {
        setError(await readError(res, fallback));
        return;
      }
      onChanged(message);
    } finally {
      setSaving(false);
    }
  }

  function patch(body: Record<string, unknown>, message: string) {
    if (selected?.kind !== "appointment") return;
    return run(
      () =>
        fetch(`/api/appointments/${selected.data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      "Não foi possível atualizar a consulta",
      message
    );
  }

  function reschedule() {
    if (selected?.kind !== "appointment") return;
    const a = selected.data;
    const duration = new Date(a.endAt).getTime() - new Date(a.startAt).getTime();
    const startAt = fromBrazilLocalInput(start);
    return patch(
      {
        dentistId,
        startAt: startAt.toISOString(),
        endAt: new Date(startAt.getTime() + duration).toISOString(),
      },
      "Consulta remarcada."
    );
  }

  function removeBlock() {
    if (selected?.kind !== "block") return;
    return run(
      () => fetch(`/api/time-blocks/${selected.data.id}`, { method: "DELETE" }),
      "Não foi possível remover o bloqueio",
      "Bloqueio removido."
    );
  }

  const canRemoveBlock =
    selected?.kind === "block" && (!ownDentistId || selected.data.dentistId === ownDentistId);

  return (
    <Dialog open={!!selected} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {selected?.kind === "appointment" && (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6">{selected.data.patientName}</DialogTitle>
              <DialogDescription>{period(selected.data.startAt, selected.data.endAt)}</DialogDescription>
            </DialogHeader>

            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={selected.data.status} />
              </dd>
              <dt className="text-muted-foreground">Profissional</dt>
              <dd className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: dentists.find((d) => d.id === selected.data.dentistId)?.color,
                  }}
                />
                {dentistName(selected.data.dentistId)}
              </dd>
              <dt className="text-muted-foreground">Serviço</dt>
              <dd>{selected.data.serviceName ?? "Não informado"}</dd>
              {selected.data.notes && (
                <>
                  <dt className="text-muted-foreground">Observações</dt>
                  <dd className="whitespace-pre-line">{selected.data.notes}</dd>
                </>
              )}
            </dl>

            {selected.data.patientPhone && (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <a href={whatsappLink(selected.data.patientPhone)} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                  WhatsApp {selected.data.patientPhone}
                </a>
              </Button>
            )}

            {selected.data.status !== "CANCELLED" && (
              <div className="space-y-2">
                <Label htmlFor="appt-status">Alterar status</Label>
                <select
                  id="appt-status"
                  className={selectClass}
                  value={selected.data.status}
                  disabled={saving}
                  onChange={(e) =>
                    patch(
                      { status: e.target.value },
                      `Status alterado para ${STATUS_LABELS[e.target.value]}.`
                    )
                  }
                >
                  {["SCHEDULED", "CONFIRMED", "COMPLETED", "NO_SHOW"].map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {rescheduling && (
              <div className="grid gap-4 rounded-lg border p-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="resched-start">Novo início</Label>
                  <Input
                    id="resched-start"
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resched-dentist">Profissional</Label>
                  <select
                    id="resched-dentist"
                    className={selectClass}
                    value={dentistId}
                    onChange={(e) => setDentistId(e.target.value)}
                  >
                    {dentists.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}

            {selected.data.status !== "CANCELLED" && (
              <DialogFooter>
                <Button
                  variant="ghost"
                  className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  disabled={saving}
                  onClick={() => {
                    if (confirm("Cancelar esta consulta?")) {
                      patch({ status: "CANCELLED" }, "Consulta cancelada.");
                    }
                  }}
                >
                  Cancelar consulta
                </Button>
                {rescheduling ? (
                  <Button disabled={saving || !start} onClick={reschedule}>
                    {saving ? "Salvando..." : "Salvar novo horário"}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setRescheduling(true)}>
                    Remarcar
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}

        {selected?.kind === "block" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 pr-6">
                <Lock className="h-4 w-4" />
                Horário bloqueado
              </DialogTitle>
              <DialogDescription>{period(selected.data.startAt, selected.data.endAt)}</DialogDescription>
            </DialogHeader>
            <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Agenda</dt>
              <dd>{dentistName(selected.data.dentistId)}</dd>
              <dt className="text-muted-foreground">Motivo</dt>
              <dd>{selected.data.reason ?? "Não informado"}</dd>
            </dl>
            {error && (
              <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              {canRemoveBlock && (
                <Button
                  variant="destructive"
                  disabled={saving}
                  onClick={() => {
                    if (confirm("Remover este bloqueio e liberar o horário?")) removeBlock();
                  }}
                >
                  Remover bloqueio
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
