"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { whatsappLink } from "@/lib/whatsapp";
import { StatusBadge } from "../status-badge";
import { readError } from "../agenda/calendar-utils";

type Contact = { type: "PHONE" | "WHATSAPP" | "EMAIL"; value: string; isPrimary: boolean };

type PatientDetail = {
  id: string;
  name: string;
  cpf: string | null;
  birthDate: string | null;
  notes: string | null;
  createdAt: string;
  contacts: Contact[];
  appointments: {
    id: string;
    startAt: string;
    status: string;
    notes: string | null;
    service: { name: string } | null;
    dentist: { color: string; user: { name: string } };
  }[];
};

export function PatientSheet({ patientId, onClose }: { patientId: string | null; onClose: () => void }) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;
    setPatient(null);
    setLoadError(null);
    setMessage(null);
    fetch(`/api/patients/${patientId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res, "Não foi possível carregar o paciente"));
        return res.json() as Promise<PatientDetail>;
      })
      .then((p) => {
        if (cancelled) return;
        setPatient(p);
        setName(p.name);
        setWhatsapp(
          (p.contacts.find((c) => c.type === "WHATSAPP") ?? p.contacts.find((c) => c.type === "PHONE"))
            ?.value ?? ""
        );
        setEmail(p.contacts.find((c) => c.type === "EMAIL")?.value ?? "");
        setNotes(p.notes ?? "");
      })
      .catch((err) => !cancelled && setLoadError(err.message));
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setSaving(true);
    setMessage(null);
    // Mantém telefones extras e troca só o WhatsApp/e-mail principais.
    const others = patient.contacts.filter(
      (c) => c.type === "PHONE" && c.value !== whatsapp
    );
    const contacts = [
      ...(whatsapp.trim() ? [{ type: "WHATSAPP", value: whatsapp.trim(), isPrimary: true }] : []),
      ...(email.trim() ? [{ type: "EMAIL", value: email.trim(), isPrimary: false }] : []),
      ...others.map((c) => ({ type: c.type, value: c.value, isPrimary: false })),
    ];
    const res = await fetch(`/api/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), notes, contacts }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage({ ok: false, text: await readError(res, "Não foi possível salvar") });
      return;
    }
    const updated = await res.json();
    setPatient({ ...patient, name: updated.name, notes: updated.notes, contacts: updated.contacts });
    setMessage({ ok: true, text: "Dados salvos." });
    router.refresh();
  }

  const phone = patient?.contacts.find((c) => c.type === "WHATSAPP") ?? patient?.contacts.find((c) => c.type === "PHONE");

  return (
    <Sheet open={!!patientId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-6 pr-12">
          <SheetTitle>{patient?.name ?? "Paciente"}</SheetTitle>
          <SheetDescription>
            {patient
              ? `Cliente desde ${formatDateTime(patient.createdAt, { dateStyle: "long" })} · ${patient.appointments.length} consulta(s)`
              : "Carregando..."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {loadError && <p className="text-sm text-rose-700">{loadError}</p>}
          {!patient && !loadError && (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {patient && (
            <>
              <div className="flex flex-wrap gap-2">
                {phone && (
                  <Button asChild variant="outline">
                    <a href={whatsappLink(phone.value, `Olá, ${patient.name.split(" ")[0]}!`)} target="_blank" rel="noreferrer">
                      <MessageCircle className="mr-2 h-4 w-4 text-emerald-600" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/dashboard/agenda">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Abrir agenda
                  </Link>
                </Button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ps-name">Nome</Label>
                  <Input id="ps-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ps-whatsapp">WhatsApp</Label>
                    <Input id="ps-whatsapp" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ps-email">E-mail</Label>
                    <Input id="ps-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ps-notes">Observações</Label>
                  <Textarea id="ps-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                {message && (
                  <p
                    role={message.ok ? "status" : "alert"}
                    className={`rounded-md px-3 py-2 text-sm ${message.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}
                  >
                    {message.text}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Salvando..." : "Salvar dados"}
                  </Button>
                </div>
              </form>

              <section>
                <h3 className="mb-3 text-sm font-semibold">Histórico de consultas</h3>
                {patient.appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma consulta registrada.</p>
                ) : (
                  <ol className="space-y-2">
                    {patient.appointments.map((a) => (
                      <li key={a.id} className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: a.dentist.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{a.service?.name ?? "Consulta"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(a.startAt)} · {a.dentist.user.name}
                          </p>
                          {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
                        </div>
                        <StatusBadge status={a.status} />
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
