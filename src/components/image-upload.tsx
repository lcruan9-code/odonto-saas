"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-compress";

const ASPECTS = {
  square: "aspect-square w-24",
  wide: "aspect-[4/3] w-40",
  portrait: "aspect-[4/5] w-24",
} as const;

/**
 * Campo de imagem: envio do computador (arrastar e soltar ou escolher arquivo),
 * com opção de colar um link. `value` é a URL salva no cadastro.
 */
export function ImageUpload({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
  aspect = "wide",
  maxSide = 1600,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  aspect?: keyof typeof ASPECTS;
  maxSide?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const blob = await compressImage(file, maxSide);
      const form = new FormData();
      form.append("file", blob, file.name);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Falha no envio");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no envio");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-none">{label}</p>
      <div className="flex items-start gap-4">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && !disabled) upload(file);
          }}
          aria-label={value ? `Trocar ${label.toLowerCase()}` : `Enviar ${label.toLowerCase()}`}
          className={cn(
            "relative shrink-0 overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-60",
            ASPECTS[aspect],
            dragging && "border-primary bg-primary/5"
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] text-slate-500">
              <ImagePlus className="h-5 w-5" />
              Arraste aqui
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {uploading ? "Enviando..." : value ? "Trocar imagem" : "Enviar do computador"}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onChange("")}
                className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remover
              </Button>
            )}
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setShowUrl((v) => !v)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link2 className="h-3 w-3" />
            {showUrl ? "Ocultar link" : "Usar um link da internet"}
          </button>
          {showUrl && (
            <Input
              id={id}
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="h-9"
            />
          )}
          {error && <p className="text-xs text-rose-700">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        data-upload-for={id}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
    </div>
  );
}
