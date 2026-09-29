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
    include: {
      variants: {
        orderBy: [{ active: "desc" }, { label: "asc" }],
      },
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

  return prisma.product.delete({ where: { id } });
}

/* ------------------------------------------------------------------ */
/* Variants                                                            */
/* ------------------------------------------------------------------ */

export async function createVariant({
  productId,
  accountId,
  input,
}: {
  productId: string;
  accountId: string;
  input: {
    label: string;
    price: number;
    stock?: number | null;
  };
}) {
  const product = await prisma.product.findFirst({
    where: { id: productId, whatsappAccountId: accountId },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found");

  const label = input.label.trim();
  if (!label) throw new Error("Variant label is required");

  const price = Number(input.price);
  if (Number.isNaN(price) || price < 0) {
    throw new Error("Variant price must be a positive number");
  }

  let stock: number | null = null;
  if (input.stock !== undefined && input.stock !== null) {
    const s = Number(input.stock);
    if (Number.isNaN(s) || s < 0) {
      throw new Error("Stock must be a non-negative number");
    }
    stock = Math.floor(s);
  }

  return prisma.productVariant.create({
    data: {
      productId,
      label,
      price,
      stock,
      active: true,
    },
  });
}

export async function updateVariant({
  variantId,
  productId,
  accountId,
  patch,
}: {
  variantId: string;
  productId: string;
  accountId: string;
  patch: Partial<{
    label: string;
    price: number;
    stock: number | null;
    active: boolean;
  }>;
}) {
  // Scope by product → account
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
      product: { whatsappAccountId: accountId },
    },
    select: { id: true },
  });
  if (!variant) throw new Error("Variant not found");

  const data: Record<string, unknown> = {};

  if (typeof patch.label === "string") {
    const l = patch.label.trim();
    if (!l) throw new Error("Variant label cannot be empty");
    data.label = l;
  }
  if (typeof patch.price === "number") {
    if (Number.isNaN(patch.price) || patch.price < 0) {
      throw new Error("Variant price must be a positive number");
    }
    data.price = patch.price;
  }
  if (patch.stock !== undefined) {
    if (patch.stock === null) {
      data.stock = null;
    } else {
      const s = Number(patch.stock);
      if (Number.isNaN(s) || s < 0) {
        throw new Error("Stock must be a non-negative number");
      }
      data.stock = Math.floor(s);
    }
  }
  if (typeof patch.active === "boolean") {
    data.active = patch.active;
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data,
  });
}

export async function deleteVariant({
  variantId,
  productId,
  accountId,
}: {
  variantId: string;
  productId: string;
  accountId: string;
}) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      productId,
      product: { whatsappAccountId: accountId },
    },
    select: { id: true },
  });
  if (!variant) throw new Error("Variant not found");

  return prisma.productVariant.delete({ where: { id: variantId } });
}