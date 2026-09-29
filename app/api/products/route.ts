// app/api/products/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listProducts, createProduct } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

async function getCtx() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Not signed in" as const };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { whatsappAccount: true },
  });
  if (!user) {
    return { error: "User not found" as const };
  }
  if (!user.whatsappAccount) {
    return {
      error: "Connect your WhatsApp number in Settings first",
      needsWhatsApp: true as const,
    };
  }
  return { user, account: user.whatsappAccount };
}

export async function GET(req: Request) {
  const ctx = await getCtx();
  if ("error" in ctx) {
    return NextResponse.json(
      { error: ctx.error, needsWhatsApp: "needsWhatsApp" in ctx ? ctx.needsWhatsApp : false },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("q") || undefined;
  const includeInactive = url.searchParams.get("all") === "1";

  const products = await listProducts({
    accountId: ctx.account.id,
    search,
    includeInactive,
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const ctx = await getCtx();
  if ("error" in ctx) {
    return NextResponse.json(
      { error: ctx.error, needsWhatsApp: "needsWhatsApp" in ctx ? ctx.needsWhatsApp : false },
      { status: 401 }
    );
  }
  // ... rest stays the same

  try {
    const body = await req.json();
    const product = await createProduct({
      accountId: ctx.account.id,
      input: {
        name: body?.name,
        price: body?.price,
        currency: body?.currency,
        category: body?.category,
      },
      defaultCurrency: ctx.user.baseCurrency || "USD",
    });
    return NextResponse.json({ product });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}