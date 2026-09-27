// lib/whatsapp/media.ts

const GRAPH_URL = "https://graph.facebook.com/v24.0";

/**
 * Given a Meta media ID (image, audio, document, etc.), returns the file
 * bytes and content type. Uses two API calls:
 *   1. GET /{media-id} → returns a temporary download URL
 *   2. GET that URL with auth → returns the actual bytes
 */
export async function downloadWhatsAppMedia(
  mediaId: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    console.warn("[media] WHATSAPP_ACCESS_TOKEN not set");
    return null;
  }

  try {
    // Step 1 — get the download URL
    const metaRes = await fetch(`${GRAPH_URL}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaRes.ok) {
      const text = await metaRes.text();
      console.error(`[media] metadata error ${metaRes.status}: ${text}`);
      return null;
    }

    const meta = (await metaRes.json()) as {
      url?: string;
      mime_type?: string;
    };

    if (!meta.url) {
      console.warn("[media] no url in metadata response");
      return null;
    }

    // Step 2 — download the actual bytes
    const fileRes = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!fileRes.ok) {
      console.error(`[media] download error ${fileRes.status}`);
      return null;
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      buffer,
      contentType: meta.mime_type || fileRes.headers.get("content-type") || "",
    };
  } catch (error) {
    console.error("[media] failed:", error);
    return null;
  }
}