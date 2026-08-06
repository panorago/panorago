import QRCode from "qrcode";
import type { PanoraAtmosphere } from "@/lib/panora/atmospheres";

export type ShareCardRatio = "square" | "og" | "story";

const SIZES: Record<ShareCardRatio, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  og: { w: 1200, h: 630 },
  story: { w: 1080, h: 1920 },
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load share card image"));
    img.src = src;
  });
}

function coverDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  ctx.drawImage(img, (w - sw) / 2, (h - sh) / 2, sw, sh);
}

export async function downloadSmartShareCard(opts: {
  placeName: string;
  locationLine: string;
  heroImage: string;
  shareUrl: string;
  atmospheres: PanoraAtmosphere[];
  ratio?: ShareCardRatio;
  filename?: string;
}) {
  const ratio = opts.ratio ?? "square";
  const { w, h } = SIZES[ratio];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const [hero, qrDataUrl] = await Promise.all([
    loadImage(opts.heroImage).catch(() => null),
    QRCode.toDataURL(opts.shareUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 280,
      color: { dark: "#0A192F", light: "#FFFFFF" },
    }),
  ]);

  // Base navy
  ctx.fillStyle = "#0A192F";
  ctx.fillRect(0, 0, w, h);

  if (hero) {
    coverDraw(ctx, hero, w, h);
  }

  // Dark glass gradient
  const gradient = ctx.createLinearGradient(0, h * 0.25, 0, h);
  gradient.addColorStop(0, "rgba(10,25,47,0.15)");
  gradient.addColorStop(0.45, "rgba(10,25,47,0.55)");
  gradient.addColorStop(1, "rgba(10,25,47,0.94)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Gold border
  const inset = Math.round(w * 0.035);
  ctx.strokeStyle = "#C29B62";
  ctx.lineWidth = Math.max(4, Math.round(w * 0.006));
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  const pad = inset + Math.round(w * 0.04);
  const isWide = ratio === "og";
  const isStory = ratio === "story";

  // Brand
  ctx.fillStyle = "#C29B62";
  ctx.font = `600 ${Math.round(w * 0.028)}px Georgia, serif`;
  ctx.fillText("PANORA GO", pad, pad + Math.round(h * 0.04));

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `400 ${Math.round(w * 0.022)}px system-ui, sans-serif`;
  ctx.fillText(
    "Discover. Connect. Belong.",
    pad,
    pad + Math.round(h * 0.07),
  );

  // Place name
  const nameSize = isWide
    ? Math.round(w * 0.048)
    : isStory
      ? Math.round(w * 0.072)
      : Math.round(w * 0.062);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `600 ${nameSize}px Georgia, serif`;
  const nameY = isWide ? h * 0.55 : isStory ? h * 0.62 : h * 0.58;
  wrapText(ctx, opts.placeName, pad, nameY, w - pad * 2 - (isWide ? 200 : 0), nameSize * 1.15);

  // Location
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = `400 ${Math.round(w * 0.026)}px system-ui, sans-serif`;
  ctx.fillText(opts.locationLine, pad, nameY + nameSize * 2.4);

  // Atmospheres
  const labels = opts.atmospheres
    .slice(0, 3)
    .map((a) => a.label)
    .join("  ·  ");
  if (labels) {
    ctx.fillStyle = "#C29B62";
    ctx.font = `500 ${Math.round(w * 0.024)}px system-ui, sans-serif`;
    ctx.fillText(labels, pad, nameY + nameSize * 3.2);
  }

  // QR
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = isWide ? Math.round(h * 0.28) : Math.round(w * 0.18);
  const qrX = w - pad - qrSize;
  const qrY = h - pad - qrSize;
  ctx.fillStyle = "#FFFFFF";
  const qrPad = 10;
  ctx.fillRect(qrX - qrPad, qrY - qrPad, qrSize + qrPad * 2, qrSize + qrPad * 2);
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `400 ${Math.round(w * 0.018)}px system-ui, sans-serif`;
  ctx.fillText("Scan to explore", qrX - qrPad, qrY - qrPad - 12);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Share card export failed");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download =
    opts.filename ??
    `panora-${opts.placeName.toLowerCase().replace(/\s+/g, "-")}-${ratio}.png`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let cy = y;
  let lines = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
      lines += 1;
      if (lines >= 3) break;
    } else {
      line = test;
    }
  }
  if (line && lines < 3) ctx.fillText(line, x, cy);
}
