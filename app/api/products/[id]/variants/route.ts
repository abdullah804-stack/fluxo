// app/api/products/[id]/variants/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVariant } from "@/lib/products/queries";

export const dynamic = "force-dynamic";

async function getAccount() {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "Not signed in" as const };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { whatsappAccount: true },
  });
  if (!user) return { error: "User not found" as const };
  if (!user.whatsappAccount) {
    return {
      error: "Connect your WhatsApp number in Settings first",
      needsWhatsApp: true as const,
    };
  }
  return user.whatsappAccount;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const account = await getAccount();
  if ("error" in account) {
    return NextResponse.json(
      {
        error: account.error,
        needsWhatsApp: "needsWhatsApp" in account ? account.needsWhatsApp : false,
      },
      { status: 401 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const variant = await createVariant({
      productId: id,
      accountId: account.id,
      input: {
        label: body?.label,
        price: Number(body?.price),
        stock:
          body?.stock === undefined || body?.stock === null || body?.stock === ""
            ? null
            : Number(body.stock),
      },
    });
    return NextResponse.json({ variant });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create variant";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}