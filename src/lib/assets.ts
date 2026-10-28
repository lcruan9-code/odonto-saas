import { prisma } from "@/lib/prisma";

/** Limite por imagem já comprimida no navegador (Vercel aceita até 4,5 MB por requisição). */
export const MAX_ASSET_BYTES = 3 * 1024 * 1024;

const ASSET_URL = /^\/api\/assets\/([a-z0-9]+)$/;

export function assetUrl(id: string) {
  return `/api/assets/${id}`;
}

/** Tipo real pelo conteúdo (não confia no nome nem no Content-Type do envio). SVG é recusado. */
export function detectImageType(bytes: Uint8Array) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length > 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)
  ) {
    return "image/png";
  }
  if (
    bytes.length > 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Apaga imagens enviadas que deixaram de ser usadas num campo (ex.: logo
 * trocado). URLs externas são ignoradas; só remove arquivos da própria clínica.
 */
export async function deleteReplacedAssets(
  clinicId: string,
  before: (string | null | undefined)[],
  after: (string | null | undefined)[]
) {
  const kept = new Set(after.filter(Boolean));
  const ids = before
    .filter((url): url is string => !!url && !kept.has(url))
    .map((url) => ASSET_URL.exec(url)?.[1])
    .filter((id): id is string => !!id);
  if (ids.length === 0) return;
  await prisma.asset.deleteMany({ where: { id: { in: ids }, clinicId } });
}
