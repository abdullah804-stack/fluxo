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

    // Detect base currency from the phone number's country code
function detectBaseCurrency(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const map: Record<string, string> = {
    "92": "PKR",
    "91": "INR",
    "880": "BDT",
    "1": "USD",
    "44": "GBP",
    "971": "AED",
    "966": "SAR",
    "234": "NGN",
    "27": "ZAR",
    "62": "IDR",
    "60": "MYR",
    "63": "PHP",
    "84": "VND",
    "90": "TRY",
    "20": "EGP",
    "7": "RUB",
    "86": "CNY",
    "81": "JPY",
    "61": "AUD",
    "33": "EUR",
  };
  // Try longest prefix first (3 digits, then 2, then 1)
  for (const len of [3, 2, 1]) {
    const prefix = cleaned.slice(0, len);
    if (map[prefix]) return map[prefix];
  }
  return "USD";
}

const detectedCurrency = detectBaseCurrency(phoneNumber);

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

// Update the user's base currency based on phone code
await prisma.user.update({
  where: { id: user.id },
  data: { baseCurrency: detectedCurrency },
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