"use client";
// app/dashboard/products/ProductsClient.tsx
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const BORDER = "#E6EAF5";
const LINE_SOFT = "#F3F5FB";
const TEXT_PRIMARY = "#0B1220";
const TEXT_SECONDARY = "#556075";
const TEXT_MUTED = "#8B95AB";
const ACCENT = "#3B6BFF";

export interface VariantRow {
  id: string;
  label: string;
  price: number;
  stock: number | null;
  active: boolean;
}

export interface ProductRow {
  id: string;
  name: string;
  price: number;
  currency: string;
  category: string | null;
  active: boolean;
  variants: VariantRow[];
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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!showInactive && !p.active) return false;
      if (!search) return true;
      const hay = `${p.name} ${p.category ?? ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
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

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
                <th className="w-8 px-3 py-3" />
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
                  Variants
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
                            {filtered.map((p) => {
                const isOpen = expanded.has(p.id);
                return (
                  <Fragment key={p.id}>
                    <ProductRowItem
                      product={p}
                      onChanged={refresh}
                      isOpen={isOpen}
                      onToggleExpand={() => toggleExpanded(p.id)}
                    />
                    {isOpen && (
                      <VariantsPanel
                        product={p}
                        onChanged={refresh}
                      />
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main product row                                                    */
/* ------------------------------------------------------------------ */

function ProductRowItem({
  product,
  onChanged,
  isOpen,
  onToggleExpand,
}: {
  product: ProductRow;
  onChanged: () => void | Promise<void>;
  isOpen: boolean;
  onToggleExpand: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [category, setCategory] = useState(product.category ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeVariantCount = product.variants.filter((v) => v.active).length;

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
    if (!confirm(`Delete "${product.name}"? This will also delete all variants. This cannot be undone.`)) return;
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
        <td className="px-3 py-3.5">
          <button
            onClick={onToggleExpand}
            aria-label={isOpen ? "Collapse" : "Expand"}
            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors"
            style={{
              color: TEXT_MUTED,
              background: isOpen ? "#F0F4FF" : "transparent",
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 150ms",
              }}
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </td>
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
        <td className="px-5 py-3.5 text-xs" style={{ color: TEXT_SECONDARY }}>
          {activeVariantCount > 0
            ? `${activeVariantCount} option${activeVariantCount > 1 ? "s" : ""}`
            : "—"}
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
          <td colSpan={7} className="px-5 pb-2 text-xs" style={{ color: "#EF4444" }}>
            {error}
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Variants panel                                                      */
/* ------------------------------------------------------------------ */

function VariantsPanel({
  product,
  onChanged,
}: {
  product: ProductRow;
  onChanged: () => void | Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function removeVariant(variantId: string, label: string) {
    if (!confirm(`Delete variant "${label}"?`)) return;
    setError("");
    try {
      const res = await fetch(
        `/api/products/${product.id}/variants/${variantId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to delete");
        return;
      }
      await onChanged();
    } catch {
      setError("Network error");
    }
  }

  return (
    <tr style={{ background: "#FAFBFE" }}>
      <td />
      <td colSpan={6} className="px-5 py-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold uppercase tracking-[0.12em]"
              style={{ color: TEXT_MUTED }}
            >
              Variants
            </span>
            <button
              onClick={() => setAdding(true)}
              className="rounded-md px-2.5 py-1 text-xs font-medium"
              style={{ color: ACCENT }}
            >
              + Add variant
            </button>
          </div>

          {product.variants.length === 0 && !adding && (
            <p className="text-xs" style={{ color: TEXT_SECONDARY }}>
              No variants. Orders will use the base price{" "}
              {formatPrice(product.price, product.currency)}.
            </p>
          )}

          {product.variants.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {product.variants.map((v) => (
                <VariantRowItem
                  key={v.id}
                  variant={v}
                  currency={product.currency}
                  productId={product.id}
                  onChanged={onChanged}
                  onDelete={() => removeVariant(v.id, v.label)}
                />
              ))}
            </div>
          )}

          {adding && (
            <AddVariantForm
              productId={product.id}
              onCancel={() => setAdding(false)}
              onSaved={async () => {
                setAdding(false);
                await onChanged();
              }}
            />
          )}

          {error && (
            <p className="text-xs" style={{ color: "#EF4444" }}>
              {error}
            </p>
          )}
        </div>
      </td>
    </tr>
  );
}

function VariantRowItem({
  variant,
  currency,
  productId,
  onChanged,
  onDelete,
}: {
  variant: VariantRow;
  currency: string;
  productId: string;
  onChanged: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(variant.label);
  const [price, setPrice] = useState(String(variant.price));
  const [stock, setStock] = useState(
    variant.stock === null ? "" : String(variant.stock)
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/products/${productId}/variants/${variant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            price: Number(price),
            stock: stock.trim() === "" ? null : Number(stock),
          }),
        }
      );
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
      await fetch(
        `/api/products/${productId}/variants/${variant.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !variant.active }),
        }
      );
      await onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2"
      style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}
    >
      {editing ? (
        <>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="flex-1 rounded-md px-2 py-1 text-sm outline-none"
            style={{ border: `1px solid ${BORDER}`, minWidth: 120 }}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="w-28 rounded-md px-2 py-1 text-right text-sm outline-none"
            style={{ border: `1px solid ${BORDER}` }}
          />
          <input
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="w-24 rounded-md px-2 py-1 text-right text-sm outline-none"
            style={{ border: `1px solid ${BORDER}` }}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditing(false);
                setLabel(variant.label);
                setPrice(String(variant.price));
                setStock(variant.stock === null ? "" : String(variant.stock));
                setError("");
              }}
              disabled={busy}
              className="text-xs font-medium"
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
        </>
      ) : (
        <>
          <span
            className="flex-1 text-sm font-medium"
            style={{
              color: TEXT_PRIMARY,
              opacity: variant.active ? 1 : 0.5,
            }}
          >
            {variant.label}
          </span>
          <span
            className="tnum text-sm font-medium"
            style={{ color: TEXT_PRIMARY }}
          >
            {formatPrice(variant.price, currency)}
          </span>
          <span className="w-24 text-right text-xs" style={{ color: TEXT_MUTED }}>
            {variant.stock === null
              ? "—"
              : variant.stock === 0
              ? "Out of stock"
              : `${variant.stock} in stock`}
          </span>
          <button
            onClick={toggleActive}
            disabled={busy}
            className="rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: variant.active ? "#ECFDF5" : "#F3F5FB",
              color: variant.active ? "#047857" : TEXT_SECONDARY,
            }}
          >
            {variant.active ? "Active" : "Inactive"}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium"
            style={{ color: TEXT_SECONDARY }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs font-medium"
            style={{ color: "#EF4444" }}
          >
            Delete
          </button>
        </>
      )}
      {error && (
        <span className="w-full text-xs" style={{ color: "#EF4444" }}>
          {error}
        </span>
      )}
    </div>
  );
}

function AddVariantForm({
  productId,
  onCancel,
  onSaved,
}: {
  productId: string;
  onCancel: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [label, setLabel] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          price: Number(price),
          stock: stock.trim() === "" ? null : Number(stock),
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
      className="flex flex-wrap items-center gap-3 rounded-lg px-3 py-2"
      style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Label (e.g. Small, 1 kg, Chocolate)"
        className="flex-1 rounded-md px-2 py-1 text-sm outline-none"
        style={{ border: `1px solid ${BORDER}`, minWidth: 200 }}
        autoFocus
        required
      />
      <input
        type="number"
        min="0"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        className="w-28 rounded-md px-2 py-1 text-right text-sm outline-none"
        style={{ border: `1px solid ${BORDER}` }}
        required
      />
      <input
        type="number"
        min="0"
        step="1"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        placeholder="Stock (opt)"
        className="w-28 rounded-md px-2 py-1 text-right text-sm outline-none"
        style={{ border: `1px solid ${BORDER}` }}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="text-xs font-medium"
          style={{ color: TEXT_SECONDARY }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-white"
          style={{ background: ACCENT }}
        >
          {saving ? "..." : "Add"}
        </button>
      </div>
      {error && (
        <span className="w-full text-xs" style={{ color: "#EF4444" }}>
          {error}
        </span>
      )}
    </form>
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
            placeholder="e.g. Shirt"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
            required
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: TEXT_SECONDARY }}>
            Base price ({baseCurrency})
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
            placeholder="e.g. Tops, Cakes, Sandwiches"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{ border: `1px solid ${BORDER}`, color: TEXT_PRIMARY }}
          />
        </label>
      </div>

      <p className="mt-3 text-xs" style={{ color: TEXT_MUTED }}>
        You can add size or price variants after saving.
      </p>

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