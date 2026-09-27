// app/api/orders/[id]/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set([
  "pending",
  "out_for_delivery",
  "delivered",
  "cancelled",
]);

export async function POST(
  req: Request,
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

    const body = await req.json();
    const status = body?.status;

    if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Scope by whatsappAccountId so users can only touch their own orders
    const order = await prisma.order.findFirst({
      where: {
        id,
        whatsappAccountId: user.whatsappAccount.id,
      },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status },
    });

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    console.error("[orders/status] error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}