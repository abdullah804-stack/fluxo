"use client";
// app/dashboard/products/ProductsClient.tsx
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export interface ProductRow {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string | null;
  active: boolean;
}

export function ProductsClient({
  initialProducts,
  baseCurrency,
  itemSingular,
  itemPlural,
}: {
  initialProducts: ProductRow[];
  baseCurrency: string;
  itemSingular: string;
  itemPlural: string;
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!showInactive && !p.active) return false;
      if (!search) return true;
      return p.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [products, search, showInactive]);

  async function refresh() {
    const res = await fetch("/api/products?all=1");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${itemPlural.toLowerCase()}...`}
          className="w-64 rounded-lg px-3 py-2 text-sm outline-none"
          style={{
            border: `1px solid ${BORDER}`,
            background: "#FFFFFF",
            color: TEXT_PRIMARY,
          }}
        />
        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: TEXT_SECONDARY }}
        >
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
        <div className="ml-auto">
          <button
            onClick={() => setAdding(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ background: ACCENT }}
          >
            + Add {itemSingular.toLowerCase()}
          </button>
        </div>
      </div>

      {/* Add form */}
      {adding && (
        <AddProductForm
          baseCurrency={baseCurrency}
          itemSingular={itemSingular}
          onCancel={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await refresh();
          }}
        />
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div
          className="rounded-2xl bg-white p-8 text-center"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <p className="text-sm" style={{ color: TEXT_SECONDARY }}>
            {products.length === 0
              ? `No ${itemPlural.toLowerCase()} yet. Add your first one above.`
              : `No matches for "${search}".`}
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl bg-white shadow-sm"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th
                  className="px-5 py-3 text-left font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Name
                </th>
                <th
                  className="px-5 py-3 text-left font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Category
                </th>
                <th
                  className="px-5 py-3 text-right font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Price
                </th>
                <th
                  className="px-5 py-3 text-left font-medium"
                  style={{ color: TEXT_MUTED }}
                >
                  Status
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <ProductRowItem
                  key={p.id}
                  product={p}
                  onChanged={refresh}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRowItem({
  product,
  onChanged,
}: {
  product: ProductRow;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState(product.category ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          category: category.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to save");
        return;
      }
      setEditing(false);
      await onChanged();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    try {
      await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !product.active }),
      });
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to delete");
        return;
      }
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <tr
        className="transition-colors duration-150 hover:bg-[#F0F4FF]"
        style={{ borderBottom: `1px solid ${LINE_SOFT}` }}
      >
        <td className="px-5 py-3.5 font-medium" style={{ color: TEXT_PRIMARY }}>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md px-2 py-1 text-sm outline-none"
              style={{ border: `1px solid ${BORDER}` }}
            />
          ) : (
            <span style={{ opacity: product.active ? 1 : 0.5 }}>
              {product.name}
            </span>
          )}
        </td>
        <td className="px-5 py-3.5" style={{ color: TEXT_SECONDARY }}>
          {editing ? (
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-md px-2 py-1 text-sm outline-none"
              style={{ border: `1px solid ${BORDER}` }}
            />
          ) : (
            product.category ?? "—"
          )}
        </td>
        <td
          className="tnum px-5 py-3.5 text-right font-medium"
          style={{ color: TEXT_PRIMARY }}
        >
          {editing ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-28 rounded-md px-2 py-1 text-right text-sm outline-none"
              style={{ border: `1px solid ${BORDER}` }}
            />
          ) : (
            formatPrice(product.price, product.currency)
          )}
        </td>
        <td className="px-5 py-3.5">
          <button
            onClick={toggleActive}
            disabled={busy}
            className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-60"
            style={{
              background: product.active ? "#ECFDF5" : "#F3F5FB",
              color: product.active ? "#047857" : TEXT_SECONDARY,
            }}
          >
            {product.active ? "Active" : "Inactive"}
          </button>
        </td>
        <td className="px-5 py-3.5 text-right">
          {editing ? (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setName(product.name);
                  setPrice(String(product.price));
                  setCategory(product.category ?? "");
                  setError("");
                }}
                disabled={busy}
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={busy}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
                style={{ background: ACCENT }}
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(true)}
                className="rounded-md px-2.5 py-1 text-xs font-medium"
                style={{ color: TEXT_SECONDARY }}
              >
                Edit
              </button>
              <button
                onClick={remove}
                disabled={busy}
                className="rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-60"
                style={{ color: "#EF4444" }}
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={5} className="px-5 pb-2 text-xs" style={{ color: "#EF4444" }}>
            {error}
          </td>
        </tr>
      )}
    </>
  );
}

function AddProductForm({
  baseCurrency,
  itemSingular,
  onCancel,
  onSaved,
}: {
  baseCurrency: string;
  itemSingular: string;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: Number(price),
          category: category.trim() || null,
          currency: baseCurrency,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to save");
        return;
      }
      await onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white p-5 shadow-sm"
      style={{ border: `1px solid ${BORDER}` }}
    >
      <h3
        className="mb-4 text-sm font-semibold tracking-tight"
        style={{ color: TEXT_PRIMARY }}
      >
        Add {itemSingular.toLowerCase()}
      </h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chocolate Cake 1kg"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
            required
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
            Price ({baseCurrency})
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
            required
          />
        </label>
        <label className="flex flex-col gap-1.5 md:col-span-3">
          <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
            Category (optional)
          </span>
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Cakes, Shirts, Sandwiches"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
          />
        </label>
      </div>

      {error && (
        <p className="mt-3 text-xs" style={{ color: "#EF4444" }}>
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60"
          style={{ background: ACCENT }}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-3 py-2 text-sm font-medium"
          style={{ color: TEXT_SECONDARY }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function formatPrice(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    PKR: "Rs ",
    INR: "₹",
    AED: "AED ",
    SAR: "SAR ",
    BDT: "৳",
    NGN: "₦",
  };
  const sym = symbols[currency] || `${currency} `;
  const n = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${sym}${n}`;
}