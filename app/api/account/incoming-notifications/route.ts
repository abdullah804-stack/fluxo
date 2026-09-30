// app/api/account/incoming-notifications/route.ts
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
    const enabled = Boolean(body?.enabled);

    await prisma.user.update({
      where: { email: session.user.email },
      data: { notifyIncomingMessages: enabled },
    });

    return NextResponse.json({ ok: true, enabled });
  } catch (err) {
    console.error("[account/incoming-notifications] failed:", err);
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
}