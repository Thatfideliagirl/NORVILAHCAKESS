"use client";

import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

type Product = {
  id: string;
  name: string;
  description: string | null;
  ingredients: string[] | null;
  benefits: string[] | null;
  price_naira: number;
  active: boolean;
  featured: boolean;
  categories: { name: string } | null;
};

function fetchProducts() {
  return supabase
    .from("products")
    .select("id, name, description, ingredients, benefits, price_naira, active, featured, categories(name)")
    .order("name")
    .returns<Product[]>();
}

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-3 py-2 font-body text-small text-ink";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts().then(({ data }) => setProducts(data ?? []));
  }, []);

  async function toggleActive(product: Product) {
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
    );
    await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
  }

  function onSaved(updated: Product) {
    setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    setEditingId(null);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Products</p>
      <p className="mt-2 font-body text-body text-ink/60">
        Turn a product off to hide it from the site without deleting it. Edit to update the
        description, ingredients, or Good to Know copy.
      </p>

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[640px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <Fragment key={product.id}>
                <tr className="border-b border-clay/10 last:border-none">
                  <td className="px-4 py-3 text-ink">{product.name}</td>
                  <td className="px-4 py-3 text-ink/70">{product.categories?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-medium text-berry">
                    {formatNaira(product.price_naira)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(product)}
                      className={`rounded-pill px-4 py-1.5 text-xs font-semibold ${
                        product.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
                      }`}
                    >
                      {product.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setEditingId(editingId === product.id ? null : product.id)}
                      className="font-body text-small font-medium text-berry"
                    >
                      {editingId === product.id ? "Close" : "Edit"}
                    </button>
                  </td>
                </tr>
                {editingId === product.id && (
                  <tr className="border-b border-clay/10 last:border-none">
                    <td colSpan={5} className="bg-plaster/15 px-4 py-5">
                      <EditProductForm product={product} onSaved={onSaved} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditProductForm({
  product,
  onSaved,
}: {
  product: Product;
  onSaved: (product: Product) => void;
}) {
  const [description, setDescription] = useState(product.description ?? "");
  const [ingredients, setIngredients] = useState((product.ingredients ?? []).join(", "));
  const [benefits, setBenefits] = useState((product.benefits ?? []).join(", "));
  const [priceNaira, setPriceNaira] = useState(String(product.price_naira));
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updated = {
      description,
      ingredients: ingredients
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      benefits: benefits
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      price_naira: Number(priceNaira) || product.price_naira,
    };
    await supabase.from("products").update(updated).eq("id", product.id);
    setSaving(false);
    onSaved({ ...product, ...updated });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-3">
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${inputClasses} mt-1 resize-none`}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Ingredients (comma separated)
          </label>
          <input
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            className={`${inputClasses} mt-1`}
          />
        </div>
        <div>
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Good to Know (comma separated)
          </label>
          <input
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            className={`${inputClasses} mt-1`}
          />
        </div>
      </div>
      <div className="w-40">
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Price (₦)
        </label>
        <input
          value={priceNaira}
          onChange={(e) => setPriceNaira(e.target.value)}
          inputMode="numeric"
          className={`${inputClasses} mt-1`}
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-cocoa px-6 py-2 font-body text-small font-medium text-cream disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
