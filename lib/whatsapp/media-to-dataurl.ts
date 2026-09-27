// lib/whatsapp/media-to-dataurl.ts

/**
 * Converts raw image bytes into a data URL suitable for OpenAI-compatible
 * vision models (e.g. "data:image/jpeg;base64,/9j/4AAQ...").
 */
export function bufferToDataUrl(
  buffer: Buffer,
  contentType: string
): string {
  const mime = contentType || "image/jpeg";
  const base64 = buffer.toString("base64");
  return `data:${mime};base64,${base64}`;
}