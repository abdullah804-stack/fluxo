// lib/products/catalogue-context.ts
import { prisma } from "@/lib/prisma";

/**
 * Returns a compact, human-readable catalogue summary for a given account.
 * Used to give the AI context about what products the seller offers.
 *
 * Caps at `maxProducts` items to keep the prompt small.
 * Only includes active products and active variants.
 */
export async function buildCatalogueSummary(
  accountId: string,
  options: { maxProducts?: number; maxVariantsPerProduct?: number } = {}
): Promise<string> {
  const { maxProducts = 30, maxVariantsPerProduct = 8 } = options;

  const products = await prisma.product.findMany({
    where: { whatsappAccountId: accountId, active: true },
    include: {
      variants: {
        where: { active: true },
        orderBy: { label: "asc" },
      },
    },
    orderBy: { name: "asc" },
    take: maxProducts,
  });

  if (products.length === 0) return "";

  const lines = products.map((p) => {
    const price = `${p.currency} ${p.price}`;
    const cat = p.category ? ` [${p.category}]` : "";
    const header = `- ${p.name} — ${price}${cat}`;
    const activeVariants = p.variants.slice(0, maxVariantsPerProduct);
    if (activeVariants.length === 0) return header;
    const variantLines = activeVariants
      .map((v) => `    · ${v.label} — ${p.currency} ${v.price}`)
      .join("\n");
    return `${header}\n${variantLines}`;
  });

  return lines.join("\n");
}