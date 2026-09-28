// app/api/cron/draft-expiry/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this endpoint daily at midnight UTC.
 * Marks all PendingDraft rows past their expiresAt as expired.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader !== expected) {
    console.warn("[cron/draft-expiry] unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    const result = await prisma.pendingDraft.updateMany({
      where: {
        status: "pending",
        expiresAt: { lt: now },
      },
      data: { status: "expired" },
    });

    console.log(
      `[cron/draft-expiry] marked ${result.count} drafts as expired`
    );

    return NextResponse.json({
      ok: true,
      expired: result.count,
      at: now.toISOString(),
    });
  } catch (err) {
    console.error("[cron/draft-expiry] failed:", err);
    return NextResponse.json(
      { error: "Failed to expire drafts" },
      { status: 500 }
    );
  }
}