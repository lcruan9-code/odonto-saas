"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { whiteLabel } from "@/config/white-label";
import {
  ScheduleEditor,
  toEditorSchedule,
  toSchedulePayload,
  validateSchedule,
  type ScheduleDay,
  type ScheduleRecord,
} from "./schedule-editor";

export type DentistData = {
  id: string;
  name: string;
  email: string;
  specialty: string | null;
  cro: string | null;
  color: string;
  photoUrl: string | null;
  publicBio: string | null;
  publicVisible: boolean;
  active: boolean;
  schedules: ScheduleRecord[];
};

async function errorFrom(res: Response, fallback: string) {
  try {
    const data = await res.json();
    if (typeof data.error === "string") return data.error;
  } catch {
    // resposta sem JSON
  }
  return fallback;
}

export function DentistSheet({
  open,
  dentist,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = novo profissional */
  dentist: DentistData | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [tab, setTab] = useState("dados");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [cro, setCro] = useState("");
  const [color, setColor] = useState<string>(whiteLabel.dentistColors[0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [publicBio, setPublicBio] = useState("");
  const [publicVisible, setPublicVisible] = useState(true);
  const [active, setActive] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleDay[]>(toEditorSchedule(null));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTab("dados");
    setName(dentist?.name ?? "");
    setEmail(dentist?.email ?? "");
    setPassword("");
    setSpecialty(dentist?.specialty ?? "");
    setCro(dentist?.cro ?? "");
    setColor(dentist?.color ?? "");
    setPhotoUrl(dentist?.photoUrl ?? "");
    setPublicBio(dentist?.publicBio ?? "");
    setPublicVisible(dentist?.publicVisible ?? true);
    setActive(dentist?.active ?? true);
    setSchedule(toEditorSchedule(dentist ? dentist.schedules : null));
    setError(null);
  }, [open, dentist]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const scheduleError = validateSchedule(schedule);
    if (scheduleError) {
      setTab("horarios");
      setError(scheduleError);
      return;
    }

    setSaving(true);
    setError(null);
    const profile = {
      name,
      email,
      specialty,
      cro,
      color: color || undefined,
      photoUrl,
      publicBio,
      publicVisible,
    };

    try {
      if (!dentist) {
        const res = await fetch("/api/dentists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, password, schedule: toSchedulePayload(schedule) }),
        });
        if (!res.ok) throw new Error(await errorFrom(res, "Não foi possível cadastrar"));
        onSaved(`${name} cadastrado(a).`);
        return;
      }

      const res = await fetch(`/api/dentists/${dentist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, active, password: password || undefined }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Não foi possível salvar os dados"));

      const sched = await fetch(`/api/dentists/${dentist.id}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSchedulePayload(schedule)),
      });
      if (!sched.ok) {
        setTab("horarios");
        throw new Error(await errorFrom(sched, "Não foi possível salvar os horários"));
      }
      onSaved(`${name} atualizado(a).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!dentist || !confirm(`Excluir ${dentist.name} definitivamente?`)) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/dentists/${dentist.id}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      setError(await errorFrom(res, "Não foi possível excluir"));
      return;
    }
    onSaved(`${dentist.name} excluído(a).`);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-6 pr-12">
          <SheetTitle>{dentist ? "Editar profissional" : "Novo profissional"}</SheetTitle>
          <SheetDescription>
            {dentist
              ? "Dados de acesso, perfil público e grade de horários."
              : "O profissional recebe um login próprio para acessar a agenda."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          // Campo obrigatório na aba escondida: mostra a aba para o navegador apontar o erro.
          onInvalidCapture={(e) => {
            const pane = (e.target as HTMLElement).closest("[data-pane]");
            if (pane) setTab(pane.getAttribute("data-pane")!);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="dados">Dados</TabsTrigger>
                <TabsTrigger value="horarios">Horários</TabsTrigger>
              </TabsList>

              {/* forceMount mantém os campos no formulário ao trocar de aba */}
              <TabsContent value="dados" data-pane="dados" forceMount className="space-y-4 data-[state=inactive]:hidden">
                <div className="space-y-2">
                  <Label htmlFor="d-name">Nome</Label>
                  <Input
                    id="d-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dra. Maria Silva"
                    required
                    minLength={2}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="d-specialty">Especialidade</Label>
                    <Input
                      id="d-specialty"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Ortodontia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="d-cro">CRO</Label>
                    <Input
                      id="d-cro"
                      value={cro}
                      onChange={(e) => setCro(e.target.value)}
                      placeholder="CRO-SP 12345"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="d-email">E-mail de acesso</Label>
                    <Input
                      id="d-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="d-password">{dentist ? "Nova senha" : "Senha"}</Label>
                    <Input
                      id="d-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={dentist ? "Deixe vazio para manter" : "Mínimo 6 caracteres"}
                      required={!dentist}
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cor na agenda</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {whiteLabel.dentistColors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Cor ${c}`}
                        aria-pressed={color.toLowerCase() === c.toLowerCase()}
                        onClick={() => setColor(c)}
                        className="h-8 w-8 rounded-full border-2 border-white ring-2 ring-transparent transition aria-pressed:ring-slate-900"
                        style={{ background: c }}
                      />
                    ))}
                    <input
                      type="color"
                      aria-label="Outra cor"
                      value={color || "#007a8a"}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border bg-transparent"
                    />
                    {!dentist && !color && (
                      <span className="text-xs text-muted-foreground">
                        Sem escolha: usa a próxima cor livre.
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="d-photo">Foto (URL)</Label>
                  <Input
                    id="d-photo"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://... ou /images/equipe/foto.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="d-bio">Mini-bio no site</Label>
                  <Textarea
                    id="d-bio"
                    rows={3}
                    value={publicBio}
                    onChange={(e) => setPublicBio(e.target.value)}
                    maxLength={1000}
                  />
                </div>

                <div className="space-y-2 rounded-lg border p-3 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={publicVisible}
                      onChange={(e) => setPublicVisible(e.target.checked)}
                    />
                    Exibir na equipe do site público
                  </label>
                  {dentist && (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={active}
                        onChange={(e) => setActive(e.target.checked)}
                      />
                      Ativo (recebe agendamentos)
                    </label>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="horarios" data-pane="horarios" forceMount className="data-[state=inactive]:hidden">
                <ScheduleEditor value={schedule} onChange={setSchedule} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-3 border-t p-4">
            {error && (
              <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {dentist && (
                <Button
                  type="button"
                  variant="ghost"
                  className="mr-auto text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  disabled={saving}
                  onClick={handleDelete}
                >
                  Excluir
                </Button>
              )}
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : dentist ? "Salvar alterações" : "Cadastrar"}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
