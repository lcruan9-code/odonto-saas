"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ClinicDraft } from "@/lib/public-clinic";

type PreviewContextValue = {
  draft: ClinicDraft;
  setFields: (fields: ClinicDraft) => void;
};

const PreviewContext = createContext<PreviewContextValue | null>(null);

/** Guarda o que está sendo digitado nos formulários para a prévia ao vivo. */
export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ClinicDraft>({});
  const setFields = useCallback((fields: ClinicDraft) => {
    setDraft((prev) => ({ ...prev, ...fields }));
  }, []);
  const value = useMemo(() => ({ draft, setFields }), [draft, setFields]);
  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>;
}

export function usePreviewDraft() {
  return useContext(PreviewContext);
}

/** Publica na prévia os valores atuais de um formulário (sem salvar nada). */
export function useSyncPreview(fields: ClinicDraft) {
  const ctx = useContext(PreviewContext);
  const key = JSON.stringify(fields);
  useEffect(() => {
    ctx?.setFields(JSON.parse(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ctx?.setFields]);
}
