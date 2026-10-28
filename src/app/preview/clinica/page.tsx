import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { publicClinicSelect } from "@/lib/public-clinic";
import { LivePreview } from "./live-preview";

export const metadata: Metadata = { title: "Prévia do site", robots: { index: false } };

// Carregada dentro do iframe da Administração: mostra o site da clínica do
// usuário logado (publicado ou não) e aplica o rascunho enviado pelo painel.
export default async function ClinicPreviewPage() {
  const session = await requireSession();
  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.clinicId },
    select: publicClinicSelect,
  });
  if (!clinic) notFound();

  return <LivePreview initial={clinic} />;
}
