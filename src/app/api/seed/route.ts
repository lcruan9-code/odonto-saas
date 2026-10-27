import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runDemoSeed } from "@/lib/demo-seed";

// Sem isto o Next pré-renderiza o GET no build e passa a servir a resposta
// estática ("rota desativada") para sempre.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Popula a empresa fictícia de demonstração a partir do navegador.
// Só funciona com SEED_SECRET configurada e a chave correta na URL.
export async function GET(req: NextRequest) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Rota desativada" }, { status: 404 });
  }
  if (req.nextUrl.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "Chave inválida" }, { status: 403 });
  }

  const result = await runDemoSeed(prisma);
  return NextResponse.json({ ok: true, ...result });
}
