import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/* ------------------------------------------------------------------ */
/* GET — Meta's webhook verification                                   */
/* ------------------------------------------------------------------ */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[webhook] verified");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

/* ------------------------------------------------------------------ */
/* POST — incoming messages                                            */
/* ------------------------------------------------------------------ */
export async function POST(req: Request) {
  const rawBody = await req.text();

  // Validate signature
  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (appSecret && signature) {
    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

    if (signature !== expected) {
      console.warn("[webhook] invalid signature");
      return new Response("Forbidden", { status: 403 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  try {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    // Skip if not a message
    if (!value?.messages || value.messages.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const message = value.messages[0];
    const fromNumber = message.from;
    const waMessageId = message.id;
    const type = message.type;

    let content: string | null = null;
    let mediaId: string | null = null;

    if (type === "text") {
      content = message.text?.body || null;
    } else if (type === "image") {
      mediaId = message.image?.id || null;
    } else if (type === "audio") {
      mediaId = message.audio?.id || null;
    } else if (type === "document") {
      mediaId = message.document?.id || null;
    }

    const phoneNumberId = value.metadata?.phone_number_id;
    const account = await prisma.whatsAppAccount.findFirst({
      where: { phoneNumberId },
    });

    if (!account) {
      console.warn("[webhook] no account for phone_number_id:", phoneNumberId);
      return NextResponse.json({ ok: true });
    }

    await prisma.message.create({
      data: {
        whatsappAccountId: account.id,
        waMessageId,
        direction: "in",
        fromNumber,
        toNumber: value.metadata?.display_phone_number || "",
        type,
        content,
        mediaId,
        rawPayload: payload,
      },
    });

    console.log("[webhook] stored message:", waMessageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] error:", error);
    return NextResponse.json({ ok: true });
  }
}