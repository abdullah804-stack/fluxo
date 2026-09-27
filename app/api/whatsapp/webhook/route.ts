// app/api/whatsapp/webhook/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { extractMessage } from "@/lib/ai/extract";
import { parseCommand } from "@/lib/ai/command";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import { convert } from "@/lib/currency/convert";
import { transcribeAudio } from "@/lib/ai/transcript";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media";
import { analyzeImage } from "@/lib/ai/vision";
import { bufferToDataUrl } from "@/lib/whatsapp/media-to-dataurl";

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

  const signature = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (appSecret && signature) {
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

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

    // Idempotent — Meta retries slow webhooks, skip duplicates
    const existing = await prisma.message.findUnique({
      where: { waMessageId },
    });

    if (existing) {
      console.log("[webhook] duplicate message, skipping:", waMessageId);
      return NextResponse.json({ ok: true });
    }

    const storedMessage = await prisma.message.create({
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

    // Owner detection
    const forceOwner = process.env.FORCE_OWNER === "true";
    const isOwnerNumber =
      forceOwner ||
      fromNumber.replace(/\D/g, "") ===
        account.phoneNumber.replace(/\D/g, "");

    /* ---------------------------------------------------------------- */
    /* Route by message type                                             */
    /* ---------------------------------------------------------------- */

    // TEXT — command or customer message
    if (type === "text" && content) {
      if (isOwnerNumber) {
        const looksLikeCommand = quickCommandCheck(content);

        if (looksLikeCommand) {
          console.log("[webhook] owner command:", content);
          handleCommandInBackground(content, account.id, fromNumber);
          return NextResponse.json({ ok: true });
        }

        console.log("[webhook] owner non-command, extracting:", content);
      }

      extractInBackground(
        storedMessage.id,
        content,
        account.userId,
        account.id,
        fromNumber
      );
    }

    // AUDIO (voice notes) — transcribe, then extract
    else if (type === "audio" && mediaId) {
      if (isOwnerNumber) {
        // Voice commands from owner — transcribe, then check if it looks
        // like a command. For MVP we only run voice through the extractor,
        // but we log this in case we want command support later.
        console.log("[webhook] owner voice note, extracting");
      }
      handleVoiceNoteInBackground(
        storedMessage.id,
        mediaId,
        account.userId,
        account.id,
        fromNumber
      );
    }

    // IMAGE — placeholder for future vision pipeline
        // IMAGE — analyze via vision model
    else if (type === "image" && mediaId) {
      handleImageInBackground(
        storedMessage.id,
        mediaId,
        account.userId,
        account.id,
        fromNumber
      );
    }

    // DOCUMENT — placeholder
    else if (type === "document" && mediaId) {
      console.log("[webhook] document received (not yet processed):", mediaId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook] error:", error);
    return NextResponse.json({ ok: true });
  }
}

/* ------------------------------------------------------------------ */
/* Background: extract business meaning from customer messages         */
/* ------------------------------------------------------------------ */
async function extractInBackground(
  messageId: string,
  content: string,
  userId: string,
  accountId: string,
  fromNumber: string
) {
  try {
    const owner = await prisma.user.findUnique({
      where: { id: userId },
    });

    const baseCurrency = owner?.baseCurrency || "USD";

    const extracted = await extractMessage(
      content,
      `${owner?.name || "this business"}\nSeller base currency: ${baseCurrency}\nCustomer phone: +${fromNumber}`
    );

    await prisma.message.update({
      where: { id: messageId },
      data: { extractedData: extracted as any },
    });

    console.log(
      "[webhook] extracted:",
      extracted.intent,
      "(confidence:",
      extracted.confidence,
      ")"
    );

    // Auto-create customer + order if this is a confident order
    if (
      extracted.intent === "order" &&
      extracted.order &&
      extracted.confidence >= 0.7
    ) {
      let customer = await prisma.customer.findUnique({
        where: {
          whatsappAccountId_phone: {
            whatsappAccountId: accountId,
            phone: fromNumber,
          },
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            whatsappAccountId: accountId,
            phone: fromNumber,
            name: extracted.customer.name,
            address: extracted.order.address,
          },
        });
      } else if (extracted.customer.name && !customer.name) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: { name: extracted.customer.name },
        });
      }

      // Currency conversion
      const rawCurrency =
        extracted.order.currency?.trim().toUpperCase() || null;
      const currencyConfidence =
        (extracted.order as any).currency_confidence ?? 1;
      const orderCurrency =
        rawCurrency && currencyConfidence >= 0.5 ? rawCurrency : null;
      const orderTotal: number | null = extracted.order.total ?? null;

      let originalAmount: number | null = null;
      let originalCurrency: string | null = null;
      let baseAmount: number | null = null;
      let exchangeRate: number | null = null;
      let exchangeRateDate: Date | null = null;

      if (orderCurrency && orderTotal != null) {
        originalAmount = orderTotal;
        originalCurrency = orderCurrency;
        if (orderCurrency === baseCurrency) {
          baseAmount = orderTotal;
          exchangeRate = 1;
          exchangeRateDate = new Date();
        } else {
          try {
            const converted = await convert(
              orderTotal,
              orderCurrency,
              baseCurrency
            );
            if (converted) {
              baseAmount = converted.amount;
              exchangeRate = converted.rate;
              exchangeRateDate = converted.date;
            }
          } catch (convErr) {
            console.error("[webhook] currency conversion failed:", convErr);
          }
        }
      }

      await prisma.order.create({
        data: {
          whatsappAccountId: accountId,
          customerId: customer.id,
          items: extracted.order.items,
          total: extracted.order.total,
          currency: extracted.order.currency,
          paymentMethod: extracted.order.payment_method,
          address: extracted.order.address,
          sourceMessageId: messageId,
          recipientName: extracted.customer.name,
          status: "pending",
          paymentStatus: "unpaid",
          originalAmount,
          originalCurrency,
          baseAmount,
          exchangeRate,
          exchangeRateDate,
        },
      });

      console.log("[webhook] order created for customer:", customer.id);
    }
  } catch (aiError) {
    console.error("[webhook] background extraction failed:", aiError);
  }
}

/* ------------------------------------------------------------------ */
/* Background: transcribe a voice note, then run the extractor         */
/* ------------------------------------------------------------------ */
async function handleVoiceNoteInBackground(
  messageId: string,
  mediaId: string,
  userId: string,
  accountId: string,
  fromNumber: string
) {
  try {
    console.log("[voice] downloading media:", mediaId);
    const media = await downloadWhatsAppMedia(mediaId);

    if (!media) {
      console.warn("[voice] download failed for", mediaId);
      return;
    }

    console.log(
      `[voice] downloaded ${(media.buffer.length / 1024).toFixed(1)} KB`
    );

    const transcription = await transcribeAudio(
      media.buffer,
      `${messageId}.ogg`
    );

    if (!transcription) {
      console.warn("[voice] transcription empty for", mediaId);
      return;
    }

    console.log("[voice] transcribed:", transcription.slice(0, 80));

    // Store the transcription as content so the message detail page shows it
    await prisma.message.update({
      where: { id: messageId },
      data: { content: `[voice] ${transcription}` },
    });

    // Run the extractor on the transcription — same pipeline as text
    await extractInBackground(
      messageId,
      transcription,
      userId,
      accountId,
      fromNumber
    );
  } catch (error) {
    console.error("[voice] failed:", error);
  }
}

/* ------------------------------------------------------------------ */
/* Background: parse + execute owner commands                          */
/* ------------------------------------------------------------------ */
async function handleCommandInBackground(
  text: string,
  accountId: string,
  replyTo: string
) {
  try {
    const command = await parseCommand(text);
    console.log(
      "[command] parsed:",
      command.intent,
      "(confidence:",
      command.confidence,
      ")"
    );

    let reply = "";

    switch (command.intent) {
      case "summary": {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysOrders = await prisma.order.count({
          where: {
            whatsappAccountId: accountId,
            createdAt: { gte: today },
          },
        });

        const pending = await prisma.order.count({
          where: { whatsappAccountId: accountId, status: "pending" },
        });

        const unpaidOrders = await prisma.order.findMany({
          where: {
            whatsappAccountId: accountId,
            paymentStatus: "unpaid",
          },
          select: { total: true },
        });

        const owedTotal = unpaidOrders.reduce(
          (sum, o) => sum + (o.total || 0),
          0
        );

        reply = `📊 *Today's Summary*\n\nOrders today: ${todaysOrders}\nPending: ${pending}\nUnpaid total: ${owedTotal.toFixed(
          0
        )}\n\nReply *pending* for the list.`;
        break;
      }

      case "list_pending": {
        const pendingOrders = await prisma.order.findMany({
          where: { whatsappAccountId: accountId, status: "pending" },
          include: { customer: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        if (pendingOrders.length === 0) {
          reply = "✓ No pending orders.";
        } else {
          const lines = pendingOrders.map((o, i) => {
            const name = o.customer.name || o.customer.phone;
            return `${i + 1}. ${name} — ${o.total || "?"} — ${
              o.paymentMethod || "?"
            }`;
          });
          reply = `📋 *Pending Orders*\n\n${lines.join("\n")}`;
        }
        break;
      }

      case "list_unpaid": {
        const unpaid = await prisma.order.findMany({
          where: {
            whatsappAccountId: accountId,
            paymentStatus: "unpaid",
          },
          include: { customer: true },
          orderBy: { createdAt: "desc" },
        });

        if (unpaid.length === 0) {
          reply = "✓ Everyone has paid.";
        } else {
          const total = unpaid.reduce((s, o) => s + (o.total || 0), 0);
          const lines = unpaid.map((o, i) => {
            const name = o.customer.name || o.customer.phone;
            return `${i + 1}. ${name} — ${o.total || "?"}`;
          });
          reply = `💰 *Unpaid Orders*\n\n${lines.join(
            "\n"
          )}\n\n*Total owed:* ${total.toFixed(0)}`;
        }
        break;
      }

      case "mark_delivered": {
        const name = command.params.customer_name;
        if (!name) {
          reply = "Please say the customer name: *delivered [name]*";
          break;
        }

        const customer = await prisma.customer.findFirst({
          where: {
            whatsappAccountId: accountId,
            name: { contains: name, mode: "insensitive" },
          },
        });

        if (!customer) {
          reply = `No customer found matching *${name}*.`;
          break;
        }

        const order = await prisma.order.findFirst({
          where: { customerId: customer.id, status: { not: "delivered" } },
          orderBy: { createdAt: "desc" },
        });

        if (!order) {
          reply = `No active order for *${name}*.`;
          break;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { status: "delivered" },
        });

        reply = `✓ Marked *${name}'s* order as delivered.`;
        break;
      }

            case "mark_shipped": {
        const name = command.params.customer_name;
        if (!name) {
          reply = "Please say the customer name: *shipped [name]*";
          break;
        }

        const customer = await prisma.customer.findFirst({
          where: {
            whatsappAccountId: accountId,
            name: { contains: name, mode: "insensitive" },
          },
        });

        if (!customer) {
          reply = `No customer found matching *${name}*.`;
          break;
        }

        const order = await prisma.order.findFirst({
          where: {
            customerId: customer.id,
            status: { in: ["pending", "out_for_delivery"] },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!order) {
          reply = `No active order for *${name}*.`;
          break;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { status: "out_for_delivery" },
        });

        reply = `✓ Marked *${name}'s* order as out for delivery.`;
        break;
      }

      case "cancel": {
        const name = command.params.customer_name;
        if (!name) {
          reply = "Please say the customer name: *cancel [name]*";
          break;
        }

        const customer = await prisma.customer.findFirst({
          where: {
            whatsappAccountId: accountId,
            name: { contains: name, mode: "insensitive" },
          },
        });

        if (!customer) {
          reply = `No customer found matching *${name}*.`;
          break;
        }

        const order = await prisma.order.findFirst({
          where: {
            customerId: customer.id,
            status: { not: "cancelled" },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!order) {
          reply = `No active order for *${name}*.`;
          break;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { status: "cancelled" },
        });

        reply = `✓ Cancelled *${name}'s* order.`;
        break;
      }

      case "mark_paid": {
        const name = command.params.customer_name;
        if (!name) {
          reply = "Please say the customer name: *paid [name]*";
          break;
        }

        const customer = await prisma.customer.findFirst({
          where: {
            whatsappAccountId: accountId,
            name: { contains: name, mode: "insensitive" },
          },
        });

        if (!customer) {
          reply = `No customer found matching *${name}*.`;
          break;
        }

        const order = await prisma.order.findFirst({
          where: { customerId: customer.id, paymentStatus: "unpaid" },
          orderBy: { createdAt: "desc" },
        });

        if (!order) {
          reply = `No unpaid order for *${name}*.`;
          break;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: "paid" },
        });

        reply = `✓ Marked *${name}'s* order as paid.`;
        break;
      }

      case "help":
      default: {
                reply = `*Fluxo Commands*\n\n• *summary* — today's business\n• *pending* — list pending orders\n• *who owes me* — unpaid orders\n• *shipped [name]* — mark out for delivery\n• *delivered [name]* — mark delivered\n• *cancel [name]* — cancel the order\n• *paid [name]* — mark paid`;
        break;
      }
    }

    await sendWhatsAppMessage(replyTo, reply);
  } catch (error) {
    console.error("[command] error:", error);
    await sendWhatsAppMessage(
      replyTo,
      "Sorry, I couldn't process that command."
    );
  }
}

/* ------------------------------------------------------------------ */
/* Helper: does this text look like a known command?                   */
/* ------------------------------------------------------------------ */
function quickCommandCheck(text: string): boolean {
  const t = text.trim().toLowerCase();

  const exactCommands = [
    "summary",
    "help",
    "pending",
    "unpaid",
    "commands",
    "today",
  ];
  if (exactCommands.includes(t)) return true;

    const patterns = [
    /^who owes/i,
    /^kis ne/i,
    /^show pending/i,
    /^show unpaid/i,
    /^show orders/i,
    /^list pending/i,
    /^shipped\s+\w+/i,
    /^mark shipped\s+\w+/i,
    /^out for delivery\s+\w+/i,
    /^delivered\s+\w+/i,
    /^mark delivered\s+\w+/i,
    /^cancel\s+\w+/i,
    /^cancel order\s+\w+/i,
    /^paid\s+\w+/i,
    /^mark paid\s+\w+/i,
    /^invoice\s+\w+/i,
    /^remind\b/i,
    /^search\b/i,
    /^dhundo\b/i,
    /^sab ko remind/i,
  ];

  for (const p of patterns) {
    if (p.test(t)) return true;
  }

  return false;
}
/* ------------------------------------------------------------------ */
/* Background: analyze an image and update records if it's a payment  */
/* ------------------------------------------------------------------ */
async function handleImageInBackground(
  messageId: string,
  mediaId: string,
  userId: string,
  accountId: string,
  fromNumber: string
) {
  try {
    console.log("[image] downloading media:", mediaId);
    const media = await downloadWhatsAppMedia(mediaId);

    if (!media) {
      console.warn("[image] download failed for", mediaId);
      return;
    }

    console.log(
      `[image] downloaded ${(media.buffer.length / 1024).toFixed(1)} KB`
    );

    const owner = await prisma.user.findUnique({
      where: { id: userId },
    });

    const baseCurrency = owner?.baseCurrency || "USD";

    const dataUrl = bufferToDataUrl(media.buffer, media.contentType);

    const analysis = await analyzeImage(dataUrl, {
      businessName: owner?.name || "this business",
      baseCurrency,
      customerPhone: fromNumber,
    });

    if (!analysis) {
      console.warn("[image] analysis returned null");
      return;
    }

    console.log(
      "[image] type:",
      analysis.imageType,
      "(confidence:",
      analysis.confidence,
      ")"
    );

    await prisma.message.update({
      where: { id: messageId },
      data: { imageAnalysis: analysis as any },
    });

    // If it's a payment screenshot with high confidence, mark the latest
    // unpaid order for this customer as paid
    if (
      analysis.imageType === "payment_screenshot" &&
      analysis.confidence >= 0.7 &&
      analysis.payment
    ) {
      const customer = await prisma.customer.findUnique({
        where: {
          whatsappAccountId_phone: {
            whatsappAccountId: accountId,
            phone: fromNumber,
          },
        },
      });

      if (!customer) {
        console.log("[image] no customer for phone, skipping payment match");
        return;
      }

      // Find the latest unpaid order for this customer
      const unpaidOrder = await prisma.order.findFirst({
        where: {
          customerId: customer.id,
          paymentStatus: "unpaid",
        },
        orderBy: { createdAt: "desc" },
      });

      if (!unpaidOrder) {
        console.log("[image] no unpaid order to mark as paid");
        return;
      }

      await prisma.order.update({
        where: { id: unpaidOrder.id },
        data: { paymentStatus: "paid" },
      });

      console.log(
        "[image] marked order as paid:",
        unpaidOrder.id,
        "| amount:",
        analysis.payment.amount,
        analysis.payment.currency,
        "| method:",
        analysis.payment.method
      );
    }
  } catch (error) {
    console.error("[image] failed:", error);
  }
}