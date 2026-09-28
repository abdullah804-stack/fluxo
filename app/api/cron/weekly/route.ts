// app/api/cron/weekly/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp/send";
import {
  computeWeeklyReport,
  formatWeeklyReport,
} from "@/lib/reports/weekly";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron hits this endpoint every Monday at 4 AM UTC (= 9 AM PKT).
 * It loops over every WhatsApp account and sends a weekly report to the
 * owner's phone number.
 *
 * Secured via the CRON_SECRET header that Vercel automatically sends.
 */
export async function GET(req: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (process.env.CRON_SECRET && authHeader !== expected) {
    console.warn("[cron/weekly] unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.whatsAppAccount.findMany({
    include: { user: true },
  });

  console.log(`[cron/weekly] running for ${accounts.length} accounts`);

  const results: { accountId: string; sent: boolean }[] = [];

  for (const account of accounts) {
    try {
      const report = await computeWeeklyReport(account.id);
      if (!report) {
        results.push({ accountId: account.id, sent: false });
        continue;
      }

      // Skip accounts with no activity — don't spam the owner.
      if (report.orderCount === 0) {
        console.log(
          `[cron/weekly] skipping ${account.id} (no orders this week)`
        );
        results.push({ accountId: account.id, sent: false });
        continue;
      }

      const message = formatWeeklyReport(report);

      // Reply to the owner's own number.
      const ownerNumber = account.phoneNumber.replace(/\D/g, "");
      const ok = await sendWhatsAppMessage(ownerNumber, message);

      console.log(
        `[cron/weekly] ${account.id} → ${ok ? "sent" : "failed"}`
      );
      results.push({ accountId: account.id, sent: ok });
    } catch (err) {
      console.error(`[cron/weekly] failed for ${account.id}:`, err);
      results.push({ accountId: account.id, sent: false });
    }
  }

  return NextResponse.json({
    ok: true,
    ran: accounts.length,
    results,
  });
}