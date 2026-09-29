// app/dashboard/products/page.tsx
import { getCtx, getBusinessTypeMeta } from "../_lib";
import { PageHeader } from "../_components/PageHeader";
import { listProducts } from "@/lib/products/queries";
import { ProductsClient } from "./ProductsClient";

export const revalidate = 0;

export default async function ProductsPage() {
  const { user, account, scope } = await getCtx();
  const baseCurrency =
    (user as { baseCurrency?: string }).baseCurrency ?? "USD";
  const businessMeta = getBusinessTypeMeta(
    (user as { businessType?: string | null }).businessType
  );

    const products = account
    ? await listProducts({
        accountId: account.id,
        includeInactive: true,
      })
    : [];

  return (
    <>
      <PageHeader
        title={businessMeta.itemPlural}
        subtitle={`Your catalogue of ${businessMeta.itemPlural.toLowerCase()}. Prices are used to auto-fill customer orders.`}
      />
            <ProductsClient
        initialProducts={products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          category: p.category,
          active: p.active,
          variants: p.variants.map((v) => ({
            id: v.id,
            label: v.label,
            price: v.price,
            stock: v.stock,
            active: v.active,
          })),
        }))}
        baseCurrency={baseCurrency}
        itemSingular={businessMeta.itemSingular}
        itemPlural={businessMeta.itemPlural}
      />
    </>
  );
}