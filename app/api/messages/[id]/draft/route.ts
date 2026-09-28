// app/api/messages/[id]/draft/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateDraftReply } from "@/lib/ai/draft-reply";

export const dynamic = "force-dynamic";

/**
 * POST — generates (or regenerates) a suggested reply for one inbound
 * message and stores it on Message.draftReply.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { whatsappAccount: true },
    });

    if (!user?.whatsappAccount) {
      return NextResponse.json(
        { error: "No WhatsApp account connected" },
        { status: 400 }
      );
    }

    const message = await prisma.message.findFirst({
      where: {
        id,
        whatsappAccountId: user.whatsappAccount.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.direction !== "in") {
      return NextResponse.json(
        { error: "Can only draft replies for inbound messages" },
        { status: 400 }
      );
    }

    if (!message.content || message.content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message has no text content" },
        { status: 400 }
      );
    }

    // Look up the customer name for context (best-effort)
    const customer = await prisma.customer.findUnique({
      where: {
        whatsappAccountId_phone: {
          whatsappAccountId: user.whatsappAccount.id,
          phone: message.fromNumber,
        },
      },
      select: { name: true },
    });

    const draft = await generateDraftReply({
      accountId: user.whatsappAccount.id,
      messageContent: message.content,
      customerPhone: message.fromNumber,
      customerName: customer?.name ?? null,
    });

    if (!draft) {
      return NextResponse.json(
        { error: "Could not generate a draft. Try again." },
        { status: 500 }
      );
    }

    const payload = {
      text: draft,
      generatedAt: new Date().toISOString(),
    };

    await prisma.message.update({
      where: { id: message.id },
      data: { draftReply: payload as any },
    });

    return NextResponse.json({ ok: true, draft: payload });
  } catch (err) {
    console.error("[messages/draft] failed:", err);
    return NextResponse.json(
      { error: "Failed to generate draft" },
      { status: 500 }
    );
  }
}