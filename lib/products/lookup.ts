// lib/products/lookup.ts
import type { Product, ProductVariant } from "@prisma/client";

interface MatchableProduct extends Product {
  variants: ProductVariant[];
}

export interface ProductMatch {
  product: MatchableProduct;
  variant: ProductVariant | null;
  score: number;
  reason: string;
}

const FILLER_WORDS = new Set([
  "waly",
  "wala",
  "wali",
  "wale",
  "waala",
  "waali",
  "the",
  "a",
  "an",
  "for",
  "ka",
  "ke",
  "ki",
  "ko",
  "se",
  "mein",
  "me",
  "of",
]);

const SIZE_WORDS = new Set([
  "small",
  "medium",
  "large",
  "xl",
  "xxl",
  "xs",
  "s",
  "m",
  "l",
  "sm",
  "md",
  "lg",
  "kg",
  "g",
  "gram",
  "grams",
  "litre",
  "liter",
  "ml",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0 && !FILLER_WORDS.has(w))
    .join(" ")
    .trim();
}

function words(text: string): string[] {
  return normalize(text).split(/\s+/).filter(Boolean);
}

/**
 * Scores how well a query string matches a product name.
 * Returns 0..1. Higher is better.
 */
function scoreName(query: string, productName: string): number {
  const q = normalize(query);
  const p = normalize(productName);
  if (!q || !p) return 0;

  // Exact match after normalization
  if (q === p) return 1.0;

  // Whole-word substring match (product name appears in query or vice versa)
  if (q.includes(p) || p.includes(q)) {
    // Score by length ratio so longer overlaps win
    const shorter = Math.min(q.length, p.length);
    const longer = Math.max(q.length, p.length);
    return 0.7 + 0.3 * (shorter / longer);
  }

  // Every word of the product name appears in the query
  const pWords = words(productName);
  const qWords = words(query);
  const pSet = new Set(pWords);
  const qSet = new Set(qWords);
  const matches = [...pSet].filter((w) => qSet.has(w)).length;
  if (matches > 0 && matches === pSet.size) {
    // Full coverage — bonus for shorter queries
    return 0.6 + 0.2 * (matches / Math.max(pWords.length, qWords.length));
  }

  // Partial word overlap
  if (matches > 0) {
    return 0.3 * (matches / pSet.size);
  }

  return 0;
}

/**
 * Scores how well a query string matches a variant label.
 */
function scoreVariant(query: string, label: string): number {
  const q = normalize(query);
  const l = normalize(label);
  if (!q || !l) return 0;
  if (q === l) return 1.0;
  if (q.includes(l) || l.includes(q)) return 0.8;
  return 0;
}

/**
 * Given a query string (e.g. "kurti medium") and a list of products,
 * returns the best match. Threshold is the minimum score to be considered.
 */
export function findBestProductMatch(
  query: string,
  products: MatchableProduct[],
  threshold = 0.5
): ProductMatch | null {
  let best: ProductMatch | null = null;

  for (const product of products) {
    if (!product.active) continue;

    const nameScore = scoreName(query, product.name);
    if (nameScore < threshold) continue;

    // Try to also match a variant
    const activeVariants = product.variants.filter((v) => v.active);
    let bestVariant: ProductVariant | null = null;
    let variantScore = 0;

    for (const v of activeVariants) {
      const s = scoreVariant(query, v.label);
      if (s > variantScore) {
        variantScore = s;
        bestVariant = v;
      }
    }

    // Combined score: name dominates, variant is a bonus
    const combined = nameScore + 0.3 * variantScore;

    if (!best || combined > best.score) {
      best = {
        product,
        variant: bestVariant,
        score: combined,
        reason: bestVariant
          ? `matched "${product.name}" (${bestVariant.label})`
          : `matched "${product.name}"`,
      };
    }
  }

  return best && best.score >= threshold ? best : null;
}

/**
 * Resolves the price for a matched product + optional variant.
 * Variant price wins if present, otherwise base product price.
 */
export function resolvePrice(match: ProductMatch): number {
  if (match.variant) return match.variant.price;
  return match.product.price;
}