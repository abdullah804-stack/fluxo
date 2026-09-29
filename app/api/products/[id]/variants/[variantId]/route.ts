// app/api/products/[id]/variants/[variantId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateVariant, deleteVariant } from "@/lib/products/queries";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
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

  const { id, variantId } = await params;

  try {
    const body = await req.json();
    const patch: Record<string, unknown> = {};
    if ("label" in body) patch.label = body.label;
    if ("price" in body) patch.price = Number(body.price);
    if ("stock" in body) {
      patch.stock =
        body.stock === null || body.stock === "" ? null : Number(body.stock);
    }
    if ("active" in body) patch.active = Boolean(body.active);

    const variant = await updateVariant({
      variantId,
      productId: id,
      accountId: account.id,
      patch,
    });
    return NextResponse.json({ variant });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update variant";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
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

  const { id, variantId } = await params;

  try {
    await deleteVariant({
      variantId,
      productId: id,
      accountId: account.id,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to delete variant";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}