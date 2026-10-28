"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Eye, Monitor, RotateCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PREVIEW_MESSAGE } from "@/lib/public-clinic";
import { usePreviewDraft } from "./preview-context";

const DEVICES = {
  desktop: { width: 1280, label: "Computador", icon: Monitor },
  mobile: { width: 390, label: "Celular", icon: Smartphone },
} as const;

type Device = keyof typeof DEVICES;

function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return wide;
}

/**
 * Prévia ao vivo do site da clínica. O iframe carrega /preview/clinica e
 * recebe por postMessage o que está sendo digitado, sem salvar nada; cada
 * vez que algo é salvo (`revision` muda) ele recarrega do banco.
 */
export function SitePreview({ revision, siteUrl }: { revision: string; siteUrl: string }) {
  const wide = useIsWide();
  const [open, setOpen] = useState(false);

  if (wide) {
    return (
      <div className="sticky top-20 h-[calc(100vh-6.5rem)] min-h-[520px]">
        <PreviewFrame revision={revision} siteUrl={siteUrl} />
      </div>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 rounded-full shadow-lg"
      >
        <Eye className="mr-2 h-4 w-4" />
        Ver prévia do site
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-3 p-4 sm:max-w-3xl">
          <SheetHeader className="pr-8 text-left">
            <SheetTitle>Prévia do site</SheetTitle>
            <SheetDescription>Mostra as alterações antes mesmo de salvar.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1">
            {open && <PreviewFrame revision={revision} siteUrl={siteUrl} defaultDevice="mobile" />}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function PreviewFrame({
  revision,
  siteUrl,
  defaultDevice = "desktop",
}: {
  revision: string;
  siteUrl: string;
  defaultDevice?: Device;
}) {
  const ctx = usePreviewDraft();
  const draft = ctx?.draft;
  const [device, setDevice] = useState<Device>(defaultDevice);
  const [reloadKey, setReloadKey] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const send = useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: PREVIEW_MESSAGE, draft: draft ?? {} },
      window.location.origin
    );
  }, [draft]);

  // Rascunho mudou: reenvia. Iframe (re)carregou: ele avisa e recebe o rascunho.
  useEffect(() => {
    send();
  }, [send]);
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.source !== frameRef.current?.contentWindow) return;
      if (e.data?.type === `${PREVIEW_MESSAGE}:ready`) send();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [send]);

  const deviceWidth = DEVICES[device].width;
  const scale = size.width > 0 ? Math.min(1, size.width / deviceWidth) : 1;
  const frameHeight = scale > 0 ? size.height / scale : size.height;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Prévia ao vivo
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-1 inline-flex rounded-md border bg-white p-0.5">
            {(Object.keys(DEVICES) as Device[]).map((key) => {
              const { label, icon: Icon } = DEVICES[key];
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={device === key}
                  title={label}
                  onClick={() => setDevice(key)}
                  className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-slate-600 aria-pressed:bg-navy aria-pressed:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Recarregar prévia"
            onClick={() => setReloadKey((k) => k + 1)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Abrir site em nova aba">
            <a href={siteUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div ref={boxRef} className="relative min-h-0 flex-1 overflow-hidden bg-slate-100">
        {size.width > 0 && (
          <div
            className="absolute top-0 overflow-hidden bg-white shadow-sm"
            style={{
              width: deviceWidth,
              height: frameHeight,
              left: Math.max(0, (size.width - deviceWidth * scale) / 2),
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <iframe
              key={`${revision}-${reloadKey}`}
              ref={frameRef}
              src="/preview/clinica"
              title="Prévia do site da clínica"
              className="h-full w-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
