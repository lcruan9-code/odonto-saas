"use client";

import { useEffect, useState } from "react";
import { ClinicHome } from "@/components/clinic-home";
import {
  PREVIEW_FIELDS,
  PREVIEW_MESSAGE,
  type ClinicDraft,
  type PublicClinic,
} from "@/lib/public-clinic";

export function LivePreview({ initial }: { initial: PublicClinic }) {
  const [draft, setDraft] = useState<ClinicDraft>({});

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type !== PREVIEW_MESSAGE || typeof e.data.draft !== "object") return;
      const next: ClinicDraft = {};
      for (const key of PREVIEW_FIELDS) {
        const value = e.data.draft[key];
        if (typeof value === "string" || value === null) next[key] = value;
      }
      setDraft(next);
    }
    window.addEventListener("message", onMessage);
    // Avisa o painel que já pode mandar o rascunho atual.
    window.parent?.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Prévia não navega nem envia formulários: só âncoras da própria página.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (link && !link.getAttribute("href")?.startsWith("#")) e.preventDefault();
    }
    function onSubmit(e: SubmitEvent) {
      e.preventDefault();
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, []);

  const clinic: PublicClinic = { ...initial };
  for (const key of PREVIEW_FIELDS) {
    if (!(key in draft)) continue;
    const value = draft[key]?.trim() || null;
    if (key === "name") clinic.name = value ?? initial.name;
    else clinic[key] = value;
  }

  return <ClinicHome clinic={clinic} />;
}
