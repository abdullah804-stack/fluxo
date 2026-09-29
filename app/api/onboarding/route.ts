// app/api/onboarding/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BUSINESS_TYPES } from "@/lib/business-types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const businessName =
      typeof body?.businessName === "string"
        ? body.businessName.trim()
        : "";
    const businessType =
      typeof body?.businessType === "string"
        ? body.businessType
        : "";

    if (!businessName || businessName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your business name" },
        { status: 400 }
      );
    }

    if (!BUSINESS_TYPES.some((b) => b.value === businessType)) {
      return NextResponse.json(
        { error: "Please choose a business type" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { businessName, businessType },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[onboarding] failed:", err);
    return NextResponse.json(
      { error: "Failed to save setup" },
      { status: 500 }
    );
  }
}