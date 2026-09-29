// app/api/account/high-value-threshold/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const raw = body?.threshold;

    // Allow null (turn off) or a positive number
    let threshold: number | null = null;
    if (raw !== null && raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (Number.isNaN(n) || n < 0) {
        return NextResponse.json(
          { error: "Threshold must be a positive number or blank" },
          { status: 400 }
        );
      }
      threshold = n === 0 ? null : n;
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { highValueThreshold: threshold },
    });

    return NextResponse.json({ ok: true, threshold });
  } catch (err) {
    console.error("[account/high-value-threshold] failed:", err);
    return NextResponse.json(
      { error: "Failed to update threshold" },
      { status: 500 }
    );
  }
}