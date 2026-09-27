// lib/invoice/generate.ts
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { prisma } from "@/lib/prisma";
import { InvoiceContent, type InvoiceData, type InvoiceItem } from "./template";

/**
 * Loads the order + customer + business, builds InvoiceData,
 * and returns the PDF bytes.
 */
export async function generateInvoicePdf(orderId: string): Promise<{
  buffer: Buffer;
  filename: string;
  invoiceNumber: string;
} | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      account: {
        include: { user: true },
      },
    },
  });

  if (!order) return null;

  const businessName =
    order.account.displayName ||
    order.account.user.name ||
    "Business";

  const customerName =
    order.recipientName ||
    order.customer.name ||
    null;

  const currency =
    order.originalCurrency ||
    order.currency ||
    order.account.user.baseCurrency ||
    "USD";

  const total = Number(
    order.originalAmount ?? order.total ?? order.baseAmount ?? 0
  );

  const rawItems = Array.isArray(order.items)
    ? (order.items as InvoiceItem[])
    : [];

  // If items have no per-unit price, distribute the total across them so
  // the invoice math adds up.
  const itemsWithoutPrice = rawItems.every(
    (it) => it.price == null || it.price === 0
  );

  const items: InvoiceItem[] = rawItems.map((it) => {
    const qty = it.quantity ?? 1;
    if (itemsWithoutPrice && total > 0 && rawItems.length === 1) {
      return { ...it, price: total / qty };
    }
    if (itemsWithoutPrice && total > 0 && rawItems.length > 1) {
      // Split total evenly by quantity across items — best we can do.
      const totalQty = rawItems.reduce(
        (s, x) => s + (x.quantity ?? 1),
        0
      );
      return {
        ...it,
        price: totalQty > 0 ? total / totalQty : 0,
      };
    }
    return it;
  });

  const invoiceNumber = `INV-${order.id.slice(-6).toUpperCase()}`;

  const data: InvoiceData = {
    invoiceNumber,
    orderId: order.id.slice(-6).toUpperCase(),
    date: order.createdAt,
    business: {
      name: businessName,
      phone: order.account.phoneNumber,
      address: null,
    },
    customer: {
      name: customerName,
      phone: order.customer.phone,
      address: order.address || order.customer.address || null,
    },
    items,
    currency,
    total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
  };

  const buffer = await renderToBuffer(
    createElement(Document, {}, createElement(InvoiceContent, { data }))
  );

  return {
    buffer: Buffer.from(buffer),
    filename: `${invoiceNumber}.pdf`,
    invoiceNumber,
  };
}