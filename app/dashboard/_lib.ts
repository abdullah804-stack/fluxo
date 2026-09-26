// app/dashboard/_lib.ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getCtx() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/login");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/login");
  const account = await prisma.whatsAppAccount.findFirst({ where: { userId: user.id } });
  // Every query is scoped through the account owned by the logged-in user.
  const scope = { whatsappAccountId: account?.id ?? "__none__" };
  return { email, user, account, scope };
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
export function ago(d: Date) {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
type Item = { name?: string; quantity?: number };
export const itemList = (items: unknown): Item[] => (Array.isArray(items) ? (items as Item[]) : []);
export function itemsSummary(items: unknown) {
  const l = itemList(items);
  if (!l.length) return "No items";
  return `${l[0].name ?? "Item"} ×${l[0].quantity ?? 1}${l.length > 1 ? ` +${l.length - 1} more` : ""}`;
}
export const orderTone = { pending: "neutral", out_for_delivery: "accent", delivered: "success", cancelled: "danger" } as const;
export const orderLabel: Record<string, string> = { pending: "Pending", out_for_delivery: "Out for delivery", delivered: "Delivered", cancelled: "Cancelled" };
export const intentOf = (d: unknown) => (d && typeof d === "object" && "intent" in d ? String((d as { intent: unknown }).intent) : null);

export const intentTone: Record<string, "accent" | "danger" | "success" | "warning" | "neutral"> = {
  order: "accent", complaint: "danger", payment: "success", question: "warning",
};
export const intentDot: Record<string, string> = {
  order: "bg-primary", complaint: "bg-rose", payment: "bg-emerald", question: "bg-amber",
};