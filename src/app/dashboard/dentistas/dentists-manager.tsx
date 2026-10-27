"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DentistSheet, type DentistData } from "./dentist-sheet";
import { WEEK } from "./schedule-editor";

export function DentistsManager({
  dentists,
  canEdit,
}: {
  dentists: (DentistData & { upcoming: number })[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<DentistData | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function openSheet(dentist: DentistData | null) {
    setNotice(null);
    setEditing(dentist);
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Profissionais</h1>
          <p className="text-sm text-muted-foreground">
            {dentists.filter((d) => d.active).length} ativo(s) de {dentists.length}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => openSheet(null)}>
            <Plus className="mr-1 h-4 w-4" />
            Novo profissional
          </Button>
        )}
      </div>

      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          Apenas administradores podem cadastrar ou editar profissionais.
        </p>
      )}

      {notice && (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dentists.map((d) => (
          <article
            key={d.id}
            data-dentist={d.name}
            className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${
              d.active ? "" : "opacity-70"
            }`}
          >
            <div className="flex items-start gap-3">
              {d.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photoUrl}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-offset-2"
                  style={{ ["--tw-ring-color" as string]: d.color }}
                />
              ) : (
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style={{ background: d.color }}
                >
                  {d.name.replace(/^Dr[a]?\.\s*/, "").charAt(0)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-semibold">{d.name}</h2>
                <p className="truncate text-sm text-muted-foreground">
                  {d.specialty || "Clínico geral"}
                  {d.cro ? ` · ${d.cro}` : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{d.email}</p>
              </div>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar ${d.name}`}
                  onClick={() => openSheet(d)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  d.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {d.active ? "Ativo" : "Inativo"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 font-medium ${
                  d.publicVisible ? "bg-sky-100 text-sky-800" : "bg-slate-200 text-slate-600"
                }`}
              >
                {d.publicVisible ? "No site" : "Oculto no site"}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                {d.upcoming} consulta(s) futura(s)
              </span>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1" aria-label="Dias de atendimento">
              {WEEK.map((w) => {
                const s = d.schedules.find((x) => x.dayOfWeek === w.key && x.isActive);
                return (
                  <div
                    key={w.key}
                    title={
                      s
                        ? `${w.label}: ${s.startTime}–${s.endTime}${
                            s.breakStart ? ` (intervalo ${s.breakStart}–${s.breakEnd})` : ""
                          }`
                        : `${w.label}: não atende`
                    }
                    className={`rounded-md py-1.5 text-center text-[11px] font-medium ${
                      s ? "text-white" : "bg-slate-100 text-slate-400"
                    }`}
                    style={s ? { background: d.color } : undefined}
                  >
                    {w.short}
                    {s && (
                      <span className="block text-[10px] font-normal opacity-90">
                        {s.startTime.slice(0, 2)}–{s.endTime.slice(0, 2)}h
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
        {dentists.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
            Nenhum profissional cadastrado ainda.
          </p>
        )}
      </div>

      <DentistSheet
        open={open}
        dentist={editing}
        onClose={() => setOpen(false)}
        onSaved={(message) => {
          setOpen(false);
          setNotice(message);
          router.refresh();
        }}
      />
    </div>
  );
}
