// lib/products/queries.ts
import { prisma } from "@/lib/prisma";

export interface ProductInput {
  name: string;
  price: number;
  currency?: string | null;
  category?: string | null;
}

export async function listProducts({
  accountId,
  search,
  includeInactive = false,
  limit = 200,
}: {
  accountId: string;
  search?: string;
  includeInactive?: boolean;
  limit?: number;
}) {
  return prisma.product.findMany({
    where: {
      whatsappAccountId: accountId,
      ...(includeInactive ? {} : { active: true }),
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
    take: limit,
  });
}

export async function createProduct({
  accountId,
  input,
  defaultCurrency,
}: {
  accountId: string;
  input: ProductInput;
  defaultCurrency: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const price = Number(input.price);
  if (Number.isNaN(price) || price < 0) {
    throw new Error("Price must be a positive number");
  }

  const currency = (input.currency || defaultCurrency || "USD")
    .trim()
    .toUpperCase();

  const category = input.category?.trim() || null;

  return prisma.product.create({
    data: {
      whatsappAccountId: accountId,
      name,
      price,
      currency,
      category,
      active: true,
    },
  });
}

export async function updateProduct({
  id,
  accountId,
  patch,
}: {
  id: string;
  accountId: string;
  patch: Partial<{
    name: string;
    price: number;
    currency: string;
    category: string | null;
    active: boolean;
  }>;
}) {
  // Ensure the product belongs to this account
  const existing = await prisma.product.findFirst({
    where: { id, whatsappAccountId: accountId },
    select: { id: true },
  });
  if (!existing) throw new Error("Product not found");

  const data: Record<string, unknown> = {};

  if (typeof patch.name === "string") {
    const n = patch.name.trim();
    if (!n) throw new Error("Name cannot be empty");
    data.name = n;
  }
  if (typeof patch.price === "number") {
    if (Number.isNaN(patch.price) || patch.price < 0) {
      throw new Error("Price must be a positive number");
    }
    data.price = patch.price;
  }
  if (typeof patch.currency === "string") {
    data.currency = patch.currency.trim().toUpperCase();
  }
  if (patch.category !== undefined) {
    data.category = patch.category ? patch.category.trim() : null;
  }
  if (typeof patch.active === "boolean") {
    data.active = patch.active;
  }

  return prisma.product.update({
    where: { id },
    data,
  });
}

export async function deleteProduct({
  id,
  accountId,
}: {
  id: string;
  accountId: string;
}) {
  const existing = await prisma.product.findFirst({
    where: { id, whatsappAccountId: accountId },
    select: { id: true },
  });
  if (!existing) throw new Error("Product not found");

  // Hard delete — orders store items as JSON, so no FK cascade issues.
  return prisma.product.delete({ where: { id } });
}