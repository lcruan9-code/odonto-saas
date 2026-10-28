import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Imagens são públicas (aparecem no site da clínica) e imutáveis: um novo
// envio gera um novo id, então o cache pode ser longo no navegador e na CDN.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const asset = await prisma.asset.findUnique({
    where: { id: params.id },
    select: { data: true, mimeType: true },
  });
  if (!asset) {
    return new NextResponse("Imagem não encontrada", { status: 404 });
  }

  return new NextResponse(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.data.length),
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
