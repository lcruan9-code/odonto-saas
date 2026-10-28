import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assetUrl, detectImageType, MAX_ASSET_BYTES } from "@/lib/assets";

// Upload de imagem (multipart, campo "file"). O navegador já envia a imagem
// redimensionada e comprimida; aqui só validamos tipo e tamanho.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json({ error: "Envie um arquivo de imagem" }, { status: 400 });
  }
  if (file.size > MAX_ASSET_BYTES) {
    return NextResponse.json({ error: "Imagem muito grande (máximo 3 MB)" }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectImageType(bytes);
  if (!mimeType) {
    return NextResponse.json({ error: "Formato não suportado. Use JPG, PNG ou WebP." }, { status: 415 });
  }

  const asset = await prisma.asset.create({
    data: { clinicId: session.user.clinicId, mimeType, size: bytes.length, data: Buffer.from(bytes) },
    select: { id: true },
  });

  return NextResponse.json({ url: assetUrl(asset.id) }, { status: 201 });
}
