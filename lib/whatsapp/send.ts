/**
 * Send a WhatsApp text message using Meta's Cloud API.
 */
export async function sendWhatsAppMessage(
  toNumber: string,
  messageText: string
): Promise<boolean> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("[whatsapp] Missing token or phone number ID");
    return false;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: toNumber,
          type: "text",
          text: { body: messageText },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[whatsapp] Send failed:", res.status, err);
      return false;
    }

    console.log("[whatsapp] Sent to", toNumber);
    return true;
  } catch (error) {
    console.error("[whatsapp] Send error:", error);
    return false;
  }
}