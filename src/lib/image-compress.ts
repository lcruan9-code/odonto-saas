// Redimensiona e comprime a imagem no navegador antes do envio: fotos de
// celular (5–12 MB) viram arquivos de poucas centenas de KB.

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadBitmap(file: File) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // cai no <img> abaixo
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file: File, maxSide = 1600): Promise<Blob> {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Formato não suportado. Use JPG, PNG ou WebP.");
  }
  const source = await loadBitmap(file).catch(() => {
    throw new Error("Não foi possível ler a imagem.");
  });
  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const ratio = Math.min(1, maxSide / Math.max(width, height));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  // WebP mantém transparência (logos); navegadores sem WebP caem em PNG/JPEG.
  let blob = await canvasToBlob(canvas, "image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") {
    blob = await canvasToBlob(canvas, file.type === "image/png" ? "image/png" : "image/jpeg", 0.85);
  }
  if (!blob) throw new Error("Não foi possível processar a imagem.");

  // Se o original já era pequeno e menor que o resultado, envia o original.
  return ratio === 1 && file.size <= blob.size ? file : blob;
}
