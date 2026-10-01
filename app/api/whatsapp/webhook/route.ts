// app/api/whatsapp/webhook/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { extractMessage } from "@/lib/ai/extract";
import { parseCommand } from "@/lib/ai/command";
import { convert } from "@/lib/currency/convert";
import { transcribeAudio } from "@/lib/ai/transcript";
import { downloadWhatsAppMedia } from "@/lib/whatsapp/media";
import { analyzeImage } from "@/lib/ai/vision";
import { bufferToDataUrl } from "@/lib/whatsapp/media-to-dataurl";
import { put } from "@vercel/blob";
import { generateInvoicePdf } from "@/lib/invoice/generate";
import { sendRemindersForAccount } from "@/lib/whatsapp/reminders";
import { searchMessages, ago } from "@/lib/whatsapp/search";
import {
  computeWeeklyReport,
  formatWeeklyReport,
} from "@/lib/reports/weekly";
import { notifyHighValueOrder } from "@/lib/whatsapp/notify-high-value";
import { notifyIncomingMessage } from "@/lib/whatsapp/notify-incoming";
import { listProducts } from "@/lib/products/queries";
import { findBestProductMatch, resolvePrice } from "@/lib/products/lookup";
import { buildCatalogueSummary } from "@/lib/products/catalogue-context";

import { notifyOwnerWithDraft } from "@/lib/whatsapp/notify-draft";

import {
  findPendingDraftsByName,
  approveAndSendDraft,
  skipDraft,
  editDraftText,
  listPendingDrafts,
} from "@/lib/whatsapp/drafts";
import {
  sendWhatsAppMessage,
  sendWhatsAppDocument,
} from "@/lib/whatsapp/send";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
          await handleCommandInBackground(content, account.id, fromNumber);
          return NextResponse.json({ ok: true });
        }

        console.log("[webhook] owner non-command, extracting:", content);
      }

        await extractInBackground(
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
        await handleImageInBackground(
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

        // Load catalogue summary for extraction context
    const catalogueSummary = await buildCatalogueSummary(accountId, {
      maxProducts: 40,
      maxVariantsPerProduct: 6,
    });

    const businessContext = [
      `${owner?.businessName || owner?.name || "this business"}`,
      `Seller base currency: ${baseCurrency}`,
      `Customer phone: +${fromNumber}`,
      catalogueSummary
        ? `\nCatalogue (use real prices, do not invent):\n${catalogueSummary}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const extracted = await extractMessage(content, businessContext);

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
            // ------------------------------------------------------------------
      // Catalogue lookup: try to fill missing prices from the seller's
      // product catalogue. We never override a price the customer gave.
      // ------------------------------------------------------------------
      if (Array.isArray(extracted.order.items) && extracted.order.items.length > 0) {
        try {
          const catalogue = await prisma.product.findMany({
            where: { whatsappAccountId: accountId, active: true },
            include: {
              variants: {
                where: { active: true },
              },
            },
          });

          if (catalogue.length > 0) {
            const updatedItems = [...extracted.order.items];
            let anyMatched = false;

            for (let i = 0; i < updatedItems.length; i++) {
              const item = updatedItems[i];
              if (item.price != null && item.price > 0) continue; // customer gave a price

              // Build a query from the item name plus any modifiers
              const queryParts = [item.name || ""];
              // (Scheduling and quantity are not part of the query)

              const match = findBestProductMatch(
                queryParts.join(" "),
                catalogue
              );

              if (match) {
                const unitPrice = resolvePrice(match);
                updatedItems[i] = {
                  ...item,
                  price: unitPrice,
                  // Preserve original item name but prefer the catalogue's canonical name
                  name: match.product.name,
                };
                anyMatched = true;
                console.log(
                  `[catalogue] matched "${item.name}" → "${match.product.name}"${
                    match.variant ? ` (${match.variant.label})` : ""
                  } @ ${unitPrice}`
                );
              }
            }

            if (anyMatched) {
              extracted.order.items = updatedItems;

              // Recompute total as sum(quantity × price) — only if
              // the AI didn't already give us a total.
              if (extracted.order.total == null) {
                const computed = updatedItems.reduce(
                  (sum, it) => sum + (it.quantity ?? 1) * (it.price ?? 0),
                  0
                );
                if (computed > 0) {
                  extracted.order.total = computed;
                  console.log(
                    `[catalogue] recomputed total → ${computed}`
                  );
                }
              }
            }
          }
        } catch (catalogueErr) {
          console.error("[catalogue] lookup failed:", catalogueErr);
        }
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

              // Parse scheduled_at if the extractor returned one
      let scheduledAt: Date | null = null;
      if (
        extracted.order.scheduled_at &&
        typeof extracted.order.scheduled_at === "string"
      ) {
        const parsed = new Date(extracted.order.scheduled_at);
        if (!Number.isNaN(parsed.getTime())) {
          scheduledAt = parsed;
        }
      }

      const createdOrder = await prisma.order.create({
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
          scheduledAt,
        },
      });

      console.log("[webhook] order created for customer:", customer.id);

      // High-value alert — fires only if the owner set a threshold
      // and this order's baseAmount crosses it.
        await notifyHighValueOrder({
        orderId: createdOrder.id,
        accountId,
        userId,
      });
    }

        // Owner notifications.
    // - If draft notifications are on AND this is a question, the draft ping
    //   covers it — skip the generic incoming ping to avoid double messages.
    // - Otherwise, ping for high-signal intents (order / complaint / question
    //   / payment) if the owner has enabled incoming alerts.

    let draftPinged = false;

    if (extracted.intent === "question") {
      const ownerPref = await prisma.user.findUnique({
        where: { id: userId },
        select: { draftNotifications: true },
      });
      if (ownerPref?.draftNotifications) {
          await notifyOwnerWithDraft({
          messageId,
          accountId,
          userId,
          customerPhone: fromNumber,
          messageContent: content,
        });
        draftPinged = true;
      }
    }

      await notifyIncomingMessage({
      messageId,
      accountId,
      userId,
      customerPhone: fromNumber,
      messageContent: content,
      intent: extracted.intent,
      skip: draftPinged,
    });
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

        const account = await prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
          include: { user: true },
        });
        const baseCurrency = account?.user.baseCurrency || "USD";

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
            status: { not: "cancelled" },
          },
          select: { baseAmount: true },
        });

        const owedTotal = unpaidOrders.reduce(
          (sum, o) => sum + Number(o.baseAmount ?? 0),
          0
        );

        const unconverted = unpaidOrders.filter(
          (o) => o.baseAmount === null || o.baseAmount === undefined
        ).length;

        const unconvertedNote =
          unconverted > 0
            ? `\n_${unconverted} order${
                unconverted > 1 ? "s" : ""
              } couldn't be converted_`
            : "";

        reply = `📊 *Today's Summary*\n\nOrders today: ${todaysOrders}\nPending: ${pending}\nUnpaid total: ${formatAmount(
          owedTotal,
          baseCurrency
        )}${unconvertedNote}\n\nReply *pending* for the list.`;
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
        const account = await prisma.whatsAppAccount.findUnique({
          where: { id: accountId },
          include: { user: true },
        });
        const baseCurrency = account?.user.baseCurrency || "USD";

        const unpaid = await prisma.order.findMany({
          where: {
            whatsappAccountId: accountId,
            paymentStatus: "unpaid",
            status: { not: "cancelled" },
          },
          include: { customer: true },
          orderBy: { createdAt: "desc" },
        });

        if (unpaid.length === 0) {
          reply = "✓ Everyone has paid.";
        } else {
          const total = unpaid.reduce(
            (s, o) => s + Number(o.baseAmount ?? 0),
            0
          );

          const unconverted = unpaid.filter(
            (o) => o.baseAmount === null || o.baseAmount === undefined
          ).length;

          const lines = unpaid.map((o, i) => {
            const name =
              o.recipientName || o.customer.name || o.customer.phone;
            const originalCur = o.originalCurrency || baseCurrency;
            const originalAmt = Number(
              o.originalAmount ?? o.total ?? 0
            );
            const display =
              originalCur === baseCurrency
                ? formatAmount(originalAmt, originalCur)
                : `${formatAmount(originalAmt, originalCur)} (≈ ${formatAmount(
                    Number(o.baseAmount ?? 0),
                    baseCurrency
                  )})`;
            return `${i + 1}. ${name} — ${display}`;
          });

          const unconvertedNote =
            unconverted > 0
              ? `\n_${unconverted} order${
                  unconverted > 1 ? "s" : ""
                } couldn't be converted_`
              : "";

          reply = `💰 *Unpaid Orders*\n\n${lines.join(
            "\n"
          )}\n\n*Total owed:* ${formatAmount(
            total,
            baseCurrency
          )}${unconvertedNote}`;
        }
        break;
      }
            case "list_repeat": {
        const repeatCustomers = await prisma.customer.findMany({
          where: {
            whatsappAccountId: accountId,
            orders: {
              some: {
                status: { not: "cancelled" },
              },
            },
          },
          include: {
            orders: {
              where: { status: { not: "cancelled" } },
              select: {
                id: true,
                baseAmount: true,
                total: true,
                originalAmount: true,
              },
            },
          },
        });

        const eligible = repeatCustomers
          .map((c) => {
            const orderCount = c.orders.length;
            const totalSpent = c.orders.reduce(
              (s, o) =>
                s +
                Number(o.baseAmount ?? o.originalAmount ?? o.total ?? 0),
              0
            );
            return {
              name: c.name || c.phone,
              orderCount,
              totalSpent,
            };
          })
          .filter((c) => c.orderCount >= 2)
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, 10);

        if (eligible.length === 0) {
          reply = "✓ No repeat customers yet.";
          break;
        }

        const lines = eligible.map(
          (c, i) =>
            `${i + 1}. *${c.name}* — ${c.orderCount} orders — Rs ${c.totalSpent.toFixed(
              0
            )}`
        );

        reply = `⭐ *Repeat Customers* (${eligible.length})\n\n${lines.join(
          "\n"
        )}`;
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
            case "invoice": {
        const name = command.params.customer_name;
        if (!name) {
          reply = "Please say the customer name: *invoice [name]*";
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

        try {
          console.log("[invoice] generating for order:", order.id);

          const pdf = await generateInvoicePdf(order.id);
          if (!pdf) {
            reply = `Could not generate invoice for *${name}*.`;
            break;
          }

          console.log(
            `[invoice] generated ${(pdf.buffer.length / 1024).toFixed(1)} KB`
          );

          const blob = await put(
            `invoices/${pdf.filename}`,
            pdf.buffer,
            {
              access: "public",
              contentType: "application/pdf",
            }
          );

          console.log("[invoice] uploaded:", blob.url);

          await sendWhatsAppDocument(
            replyTo,
            blob.url,
            pdf.filename,
            `Invoice for ${name}`
          );

          // Log the outgoing document on the message table (optional but
          // useful for the dashboard).
          try {
            await prisma.message.create({
              data: {
                whatsappAccountId: accountId,
                waMessageId: `out-invoice-${order.id}-${Date.now()}`,
                direction: "out",
                fromNumber: replyTo,
                toNumber: replyTo,
                type: "document",
                content: `[invoice] ${pdf.invoiceNumber} for ${name}`,
                mediaUrl: blob.url,
                rawPayload: {} as any,
              },
            });
          } catch (logErr) {
            console.warn("[invoice] failed to log outgoing message:", logErr);
          }

          reply = `✓ Invoice for *${name}* sent.`;
        } catch (err) {
          console.error("[invoice] failed:", err);
          reply = `Failed to generate invoice for *${name}*.`;
        }
        break;
      }
            case "remind": {
        try {
          console.log("[remind] sending to all unpaid");

          const summary = await sendRemindersForAccount(accountId, {
            customerName: null,
          });

          if (summary.sent === 0 && summary.skipped === 0) {
            reply = "✓ No unpaid customers to remind.";
            break;
          }

          if (summary.sent === 0 && summary.skipped > 0) {
            reply = `✓ Already reminded ${summary.skipped} customer${
              summary.skipped > 1 ? "s" : ""
            } in the last 24 hours. Total owed: ${formatAmount(
              summary.totalOwed,
              summary.currency
            )}`;
            break;
          }

          const skippedText =
            summary.skipped > 0
              ? ` · skipped ${summary.skipped} (recent)`
              : "";

          reply = `✓ Sent ${summary.sent} reminder${
            summary.sent > 1 ? "s" : ""
          }${skippedText}\nTotal owed: ${formatAmount(
            summary.totalOwed,
            summary.currency
          )}`;
        } catch (err) {
          console.error("[remind] failed:", err);
          reply = "Failed to send reminders.";
        }
        break;
      }

      case "remind_one": {
        const name = command.params.customer_name;
        if (!name) {
          reply =
            "Please say the customer name: *remind [name]*";
          break;
        }

        try {
          console.log("[remind] sending to one:", name);

          const summary = await sendRemindersForAccount(accountId, {
            customerName: name,
          });

          if (summary.sent === 0 && summary.skipped === 0) {
            reply = `No unpaid customer found matching *${name}*.`;
            break;
          }

          if (summary.sent === 0 && summary.skipped > 0) {
            reply = `✓ Already reminded *${name}* recently.`;
            break;
          }

          reply = `✓ Sent reminder to *${name}* · ${formatAmount(
            summary.totalOwed,
            summary.currency
          )}`;
        } catch (err) {
          console.error("[remind_one] failed:", err);
          reply = `Failed to send reminder to *${name}*.`;
        }
        break;
      }
            case "search": {
        const query = (command.params.query || "").trim();
        if (!query) {
          reply =
            "What should I search for? Try *search kurti* or *search from Sara*.";
          break;
        }

        try {
          console.log("[search] querying:", query);

          const results = await searchMessages({
            accountId,
            query,
            limit: 5,
          });

          if (results.length === 0) {
            reply = `🔍 No messages found for *${query}*.`;
            break;
          }

          const lines = results.map((r, i) => {
            const who = r.senderName || r.fromNumber;
            const preview = r.content
              ? r.content.length > 60
                ? r.content.slice(0, 60) + "…"
                : r.content
              : "(no text)";
            return `${i + 1}. *${who}* — ${preview} · ${ago(r.createdAt)}`;
          });

          reply = `🔍 *${results.length} result${
            results.length > 1 ? "s" : ""
          } for "${query}"*\n\n${lines.join("\n")}`;
        } catch (err) {
          console.error("[search] failed:", err);
          reply = `Search failed. Try a simpler keyword.`;
        }
        break;
      }
            case "weekly_report": {
        try {
          console.log("[weekly] generating report");

          const report = await computeWeeklyReport(accountId);
          if (!report) {
            reply = "Could not generate the weekly report.";
            break;
          }

          reply = formatWeeklyReport(report);
        } catch (err) {
          console.error("[weekly] failed:", err);
          reply = "Failed to generate the weekly report.";
        }
        break;
      }
          case "send_draft": {
        const name = command.params.customer_name;

        // No name given → auto-resolve if there's exactly one pending draft
        if (!name) {
          try {
            const pending = await prisma.pendingDraft.findMany({
              where: {
                whatsappAccountId: accountId,
                status: "pending",
                expiresAt: { gt: new Date() },
              },
              orderBy: { createdAt: "desc" },
              take: 5,
            });

            if (pending.length === 0) {
              reply = "No pending drafts to send.";
              break;
            }

            if (pending.length > 1) {
              const list = pending
                .map(
                  (d, i) =>
                    `${i + 1}. *${d.customerName || d.customerPhone}*`
                )
                .join("\n");
              reply = `Which draft? Reply *send [name]*:\n\n${list}`;
              break;
            }

            // Exactly one — auto-send
            const single = pending[0];
            const result = await approveAndSendDraft(single.id);

            if (!result.ok) {
              reply = `Could not send: ${result.error}.`;
              break;
            }

            reply = `✓ Sent reply to *${
              single.customerName || single.customerPhone
            }*`;
          } catch (err) {
            console.error("[send-draft] auto-resolve failed:", err);
            reply = "Failed to send the draft.";
          }
          break;
        }

        try {
          console.log("[send-draft] looking for pending draft:", name);

          const matches = await findPendingDraftsByName({
            accountId,
            name,
          });

          if (matches.length === 0) {
            reply = `No pending draft found for *${name}*. They may have already been sent, skipped, or expired.`;
            break;
          }

          if (matches.length > 1) {
            const list = matches
              .slice(0, 3)
              .map(
                (d) =>
                  `• ${d.customerName || d.customerPhone} — ${d.draftText.slice(0, 40)}…`
              )
              .join("\n");
            reply = `Multiple pending drafts match *${name}*:\n\n${list}\n\nPlease be more specific (e.g. use the full name).`;
            break;
          }

          const draft = matches[0];
          const result = await approveAndSendDraft(draft.id);

          if (!result.ok) {
            reply = `Could not send: ${result.error}.`;
            break;
          }

          reply = `✓ Sent reply to *${
            draft.customerName || draft.customerPhone
          }*`;
        } catch (err) {
          console.error("[send-draft] failed:", err);
          reply = "Failed to send the draft.";
        }
        break;
      }

            case "edit_draft": {
        const name = command.params.customer_name;
        const newText = (command.params.query || "").trim();

        if (!name) {
          reply =
            "Who should I edit? Try *edit Ahmed [new reply text]*.";
          break;
        }
        if (!newText) {
          reply =
            "What should the new reply say? Try *edit Ahmed Hi Ahmed, blue kurti available hai Rs 1,800*.";
          break;
        }

        try {
          console.log("[edit-draft] editing for:", name);

          const matches = await findPendingDraftsByName({
            accountId,
            name,
          });

          if (matches.length === 0) {
            reply = `No pending draft found for *${name}*.`;
            break;
          }

          if (matches.length > 1) {
            reply = `Multiple pending drafts match *${name}*. Please use the full name.`;
            break;
          }

          const draft = matches[0];
          await editDraftText(draft.id, newText);

          // Also refresh the draft on the message row so the dashboard
          // shows the updated version.
          try {
            await prisma.message.update({
              where: { id: draft.messageId },
              data: {
                draftReply: {
                  text: newText,
                  generatedAt: new Date().toISOString(),
                } as any,
              },
            });
          } catch (logErr) {
            console.warn("[edit-draft] message sync failed:", logErr);
          }

          reply = `✓ Updated draft for *${
            draft.customerName || draft.customerPhone
          }*:\n\n${newText}\n\nReply *send ${
            draft.customerName || draft.customerPhone
          }* to send it.`;
        } catch (err) {
          console.error("[edit-draft] failed:", err);
          reply = "Failed to edit the draft.";
        }
        break;
      }

      case "skip_draft": {
        const name = command.params.customer_name;
        if (!name) {
          reply =
            "Who should I skip? Try *skip Ahmed* or *skip Sara*.";
          break;
        }

        try {
          console.log("[skip-draft] skipping for:", name);

          const matches = await findPendingDraftsByName({
            accountId,
            name,
          });

          if (matches.length === 0) {
            reply = `No pending draft found for *${name}*.`;
            break;
          }

          if (matches.length > 1) {
            reply = `Multiple pending drafts match *${name}*. Please use the full name.`;
            break;
          }

          const draft = matches[0];
          await skipDraft(draft.id);

          reply = `✓ Skipped the draft for *${
            draft.customerName || draft.customerPhone
          }*.`;
        } catch (err) {
          console.error("[skip-draft] failed:", err);
          reply = "Failed to skip the draft.";
        }
        break;
      }

      case "list_drafts": {
        try {
          console.log("[list-drafts] listing");

          const drafts = await listPendingDrafts({
            accountId,
            limit: 10,
          });

          if (drafts.length === 0) {
            reply = "✓ No pending drafts.";
            break;
          }

          const lines = drafts.map((d, i) => {
            const who = d.customerName || d.customerPhone;
            const preview =
              d.draftText.length > 50
                ? d.draftText.slice(0, 50) + "…"
                : d.draftText;
            const hoursAgo = Math.max(
              0,
              Math.floor(
                (Date.now() - new Date(d.createdAt).getTime()) / 3600000
              )
            );
            const when =
              hoursAgo < 1
                ? "just now"
                : `${hoursAgo}h ago`;
            return `${i + 1}. *${who}* — ${preview} · ${when}`;
          });

          reply = `📝 *Pending drafts* (${drafts.length})\n\n${lines.join(
            "\n"
          )}\n\nReply *send [name]* to send, *edit [name] [text]* to change, *skip [name]* to discard.`;
        } catch (err) {
          console.error("[list-drafts] failed:", err);
          reply = "Failed to list drafts.";
        }
        break;
      }
        case "list_products": {
        try {
          const products = await listProducts({
            accountId,
            includeInactive: false,
            limit: 30,
          });

          if (products.length === 0) {
            reply =
              "No products in your catalogue yet.\n\nAdd them at /dashboard/products so Fluxo can quote prices to customers.";
            break;
          }

          const lines = products.map((p, i) => {
            const base = `${i + 1}. *${p.name}* — ${formatAmount(
              p.price,
              p.currency
            )}${p.category ? ` · ${p.category}` : ""}`;
            const activeVariants = p.variants.filter((v) => v.active);
            if (activeVariants.length === 0) return base;
            const variantLines = activeVariants
              .map(
                (v) =>
                  `   • ${v.label} — ${formatAmount(v.price, p.currency)}${
                    v.stock === 0 ? " (out of stock)" : ""
                  }`
              )
              .join("\n");
            return `${base}\n${variantLines}`;
          });

          reply = `🛍 *Your catalogue* (${products.length})\n\n${lines.join(
            "\n\n"
          )}`;
        } catch (err) {
          console.error("[list-products] failed:", err);
          reply = "Failed to load products.";
        }
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
                        reply = `*Fluxo Commands*\n\n• *summary* — today's business\n• *pending* — list pending orders\n• *who owes me* — unpaid orders\n• *repeat customers* — loyal buyers\n• *weekly report* — this week's stats\n• *products* — list your catalogue\n• *shipped [name]* — mark out for delivery\n• *delivered [name]* — mark delivered\n• *cancel [name]* — cancel the order\n• *paid [name]* — mark paid\n• *invoice [name]* — send an invoice\n• *remind all* — remind unpaid customers\n• *remind [name]* — remind one customer\n• *drafts* — list pending draft replies\n• *send [name]* — send the pending draft reply\n• *edit [name] [text]* — change the pending draft\n• *skip [name]* — discard the pending draft\n• *search [keyword]* — find past messages`;      }
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
    "drafts",
    "pending drafts",
    "show drafts",
    "list drafts",
    "my drafts",
    "products",
    "catalog",
    "catalogue",
    "menu",
    "my products",
    "my menu",
    "price list",
    "items",
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
    /^repeat/i,
    /^repeating/i,
    /^loyal/i,
    /^returning/i,
    /^top customer/i,
    /^best customer/i,
    /^bar bar order/i,
        /^frequent/i,
    /^weekly/i,
    /^week report/i,
    /^week summary/i,
    /^hafte/i,
    /^this week/i,
    /^send\s+\w+/i,
    /^send$/i,
    /^send draft\s+\w+/i,
    /^send reply\s+\w+/i,
    /^send to\s+\w+/i,
    /^approve\s+\w+/i,
    /^edit\s+\w+/i,
    /^change\s+\w+/i,
    /^update reply\s+\w+/i,
    /^rewrite\s+\w+/i,
    /^skip\s+\w+/i,
    /^discard\s+\w+/i,
    /^reject\s+\w+/i,
    /^don'?t send\s+\w+/i,
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
}/* ------------------------------------------------------------------ */
/* Helper: format money for replies                                    */
/* ------------------------------------------------------------------ */
function formatAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "Rs ",
    INR: "₹",
    AED: "AED ",
    SAR: "SAR ",
    BDT: "৳",
    NGN: "₦",
  };
  const sym = symbols[currency] || `${currency} `;
  const n = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${n}`;
}