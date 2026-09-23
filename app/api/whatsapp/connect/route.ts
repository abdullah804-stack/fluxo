import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { phoneNumber, phoneNumberId, wabaId, displayName } = await req.json();

    if (!phoneNumber || !phoneNumberId || !wabaId) {
      return NextResponse.json(
        { error: "phoneNumber, phoneNumberId, wabaId required" },
        { status: 400 }
      );
    }

    const account = await prisma.whatsAppAccount.upsert({
      where: { userId: user.id },
      update: { phoneNumber, phoneNumberId, wabaId, displayName },
      create: {
        userId: user.id,
        phoneNumber,
        phoneNumberId,
        wabaId,
        displayName,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to connect WhatsApp" },
      { status: 500 }
    );
  }
}