"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { readError } from "../agenda/calendar-utils";

export function NewPatientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setWhatsapp("");
    setEmail("");
    setCpf("");
    setBirthDate("");
    setNotes("");
    setError(null);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const contacts = [
      ...(whatsapp.trim() ? [{ type: "WHATSAPP", value: whatsapp.trim(), isPrimary: true }] : []),
      ...(email.trim() ? [{ type: "EMAIL", value: email.trim() }] : []),
    ];
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        cpf: cpf.trim() || undefined,
        birthDate: birthDate || undefined,
        notes: notes.trim() || undefined,
        contacts,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(await readError(res, "Não foi possível cadastrar o paciente"));
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
          <DialogDescription>Só o nome é obrigatório; o restante pode ser completado depois.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p-name">Nome completo</Label>
            <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-whatsapp">WhatsApp</Label>
              <Input
                id="p-whatsapp"
                inputMode="tel"
                placeholder="(11) 98765-4321"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">E-mail</Label>
              <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="p-cpf">CPF</Label>
              <Input id="p-cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-birth">Nascimento</Label>
              <Input id="p-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-notes">Observações</Label>
            <Textarea id="p-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
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
              {saving ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
