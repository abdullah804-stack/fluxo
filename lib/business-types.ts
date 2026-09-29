// lib/business-types.ts

export type BusinessType =
  | "clothing"
  | "food"
  | "bakery"
  | "cosmetics"
  | "electronics"
  | "decor"
  | "books"
  | "grocery"
  | "services"
  | "other";

export interface BusinessTypeMeta {
  value: BusinessType;
  label: string;
  /** Singular label for items in this business (e.g. "Product", "Dish") */
  itemSingular: string;
  /** Plural label for items */
  itemPlural: string;
  /** Verb used for fulfilling (delivered, served, completed) */
  fulfillmentVerb: string;
  /** Emoji used in the picker (only shown in the onboarding wizard, not in dashboard chrome) */
  emoji: string;
  /** Short description shown under the label */
  description: string;
}

export const BUSINESS_TYPES: BusinessTypeMeta[] = [
  {
    value: "clothing",
    label: "Clothing & Fashion",
    itemSingular: "Product",
    itemPlural: "Products",
    fulfillmentVerb: "delivered",
    emoji: "👕",
    description: "Shirts, suits, kurtis, dresses, footwear",
  },
  {
    value: "food",
    label: "Food & Beverage",
    itemSingular: "Dish",
    itemPlural: "Dishes",
    fulfillmentVerb: "delivered",
    emoji: "🍔",
    description: "Restaurants, home kitchens, tiffin services",
  },
  {
    value: "bakery",
    label: "Bakery & Desserts",
    itemSingular: "Item",
    itemPlural: "Items",
    fulfillmentVerb: "delivered",
    emoji: "🎂",
    description: "Cakes, pastries, bread, desserts",
  },
  {
    value: "cosmetics",
    label: "Cosmetics & Beauty",
    itemSingular: "Product",
    itemPlural: "Products",
    fulfillmentVerb: "delivered",
    emoji: "💄",
    description: "Skincare, makeup, fragrance, personal care",
  },
  {
    value: "electronics",
    label: "Electronics & Gadgets",
    itemSingular: "Product",
    itemPlural: "Products",
    fulfillmentVerb: "delivered",
    emoji: "📱",
    description: "Phones, accessories, small appliances",
  },
  {
    value: "decor",
    label: "Home Decor & Handicraft",
    itemSingular: "Product",
    itemPlural: "Products",
    fulfillmentVerb: "delivered",
    emoji: "🏺",
    description: "Wall art, vases, handmade items",
  },
  {
    value: "books",
    label: "Books & Stationery",
    itemSingular: "Product",
    itemPlural: "Products",
    fulfillmentVerb: "delivered",
    emoji: "📚",
    description: "Books, notebooks, office supplies",
  },
  {
    value: "grocery",
    label: "Groceries & General Store",
    itemSingular: "Item",
    itemPlural: "Items",
    fulfillmentVerb: "delivered",
    emoji: "🛒",
    description: "Daily essentials, packaged food, household",
  },
  {
    value: "services",
    label: "Services",
    itemSingular: "Service",
    itemPlural: "Services",
    fulfillmentVerb: "completed",
    emoji: "🔧",
    description: "Salons, repair, tutoring, freelance",
  },
  {
    value: "other",
    label: "Other",
    itemSingular: "Item",
    itemPlural: "Items",
    fulfillmentVerb: "delivered",
    emoji: "📦",
    description: "Anything else you sell on WhatsApp",
  },
];

export function getBusinessTypeMeta(
  value: string | null | undefined
): BusinessTypeMeta {
  if (!value) {
    return BUSINESS_TYPES[BUSINESS_TYPES.length - 1]; // "other"
  }
  return (
    BUSINESS_TYPES.find((b) => b.value === value) ??
    BUSINESS_TYPES[BUSINESS_TYPES.length - 1]
  );
}