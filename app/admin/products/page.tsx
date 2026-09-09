"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ingredients: string[] | null;
  benefits: string[] | null;
  image_url: string | null;
  price_naira: number;
  active: boolean;
  featured: boolean;
  category_id: string | null;
  on_sale: boolean;
  discount_percent: number | null;
  categories: { name: string } | null;
};

type Category = {
  id: string;
  name: string;
};

type VariantRow = {
  id: string | null;
  label: string;
  priceNaira: string;
};

function VariantsEditor({
  variants,
  onChange,
}: {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<VariantRow>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeRow(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...variants, { id: null, label: "", priceNaira: "" }]);
  }

  return (
    <div>
      <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
        Sizes / Inches (optional)
      </label>
      <p className="mt-1 font-body text-xs text-ink/50">
        If this product comes in different sizes at different prices, add each size and its
        price here. Leave empty to use a single price for the whole product.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {variants.map((variant, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              value={variant.label}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              placeholder="e.g. 8 inch"
              className={`${inputClasses} max-w-[180px]`}
            />
            <input
              value={variant.priceNaira}
              onChange={(e) => updateRow(index, { priceNaira: e.target.value })}
              inputMode="numeric"
              placeholder="Price (₦)"
              className={`${inputClasses} max-w-[140px]`}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="shrink-0 font-body text-small font-medium text-berry"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start font-body text-small font-medium text-cocoa"
        >
          + Add size
        </button>
      </div>
    </div>
  );
}

async function saveVariants(productId: string, variants: VariantRow[], originalIds: Set<string>) {
  const usable = variants.filter((v) => v.label.trim() && Number(v.priceNaira) > 0);
  const keptIds = new Set(usable.filter((v) => v.id).map((v) => v.id as string));
  const removedIds = Array.from(originalIds).filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    await supabase.from("product_variants").delete().in("id", removedIds);
  }

  for (let i = 0; i < usable.length; i++) {
    const v = usable[i];
    const payload = {
      product_id: productId,
      label: v.label.trim(),
      price_naira: Number(v.priceNaira),
      sort_order: i,
    };
    if (v.id) {
      await supabase.from("product_variants").update(payload).eq("id", v.id);
    } else {
      await supabase.from("product_variants").insert(payload);
    }
  }
}

function fetchProducts() {
  return supabase
    .from("products")
    .select(
      "id, slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, category_id, on_sale, discount_percent, categories(name)"
    )
    .order("name")
    .returns<Product[]>();
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-3 py-2 font-body text-small text-ink";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setProducts(data ?? []);
    });
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  async function toggleActive(product: Product) {
    setProducts((current) =>
      current.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
    );
    await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete "${product.name}"? This can't be undone.`)) return;
    setLoadError(null);
    const { error, data } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .select("id");
    if (error || !data || data.length === 0) {
      setLoadError(error?.message ?? "Could not delete this product. Please try again.");
      return;
    }
    setProducts((current) => current.filter((p) => p.id !== product.id));
  }

  function onSaved(updated: Product) {
    setProducts((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    setEditingId(null);
  }

  function onAdded(created: Product) {
    setProducts((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-heading text-berry">Products</p>
          <p className="mt-2 font-body text-body text-ink/60">
            Turn a product off to hide it from the site without deleting it. Edit to update the
            description, ingredients, or Good to Know copy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((current) => !current)}
          className="shrink-0 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream"
        >
          {adding ? "Close" : "Add Product"}
        </button>
      </div>

      {adding && (
        <div className="mt-6 rounded-panel bg-plaster/25 p-5">
          <AddProductForm categories={categories} onAdded={onAdded} />
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[640px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium"></th>
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
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((product) => (
              <Fragment key={product.id}>
                <tr className="border-b border-clay/10 last:border-none">
                  <td className="px-4 py-3">
                    {product.image_url && (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-panel">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{product.name}</td>
                  <td className="px-4 py-3 text-ink/70">{product.categories?.name ?? "-"}</td>
                  <td className="px-4 py-3 font-medium text-berry">
                    {formatNaira(product.price_naira)}
                    {product.on_sale && product.discount_percent && (
                      <span className="ml-2 rounded-pill bg-berry px-2 py-0.5 text-[10px] font-bold text-cream">
                        -{product.discount_percent}%
                      </span>
                    )}
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
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(editingId === product.id ? null : product.id)}
                        className="font-body text-small font-medium text-berry"
                      >
                        {editingId === product.id ? "Close" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(product)}
                        aria-label={`Delete ${product.name}`}
                        className="font-body text-small font-medium text-berry"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === product.id && (
                  <tr className="border-b border-clay/10 last:border-none">
                    <td colSpan={6} className="bg-plaster/15 px-4 py-5">
                      <EditProductForm product={product} categories={categories} onSaved={onSaved} />
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
  categories,
  onSaved,
}: {
  product: Product;
  categories: Category[];
  onSaved: (product: Product) => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description ?? "");
  const [ingredients, setIngredients] = useState((product.ingredients ?? []).join(", "));
  const [benefits, setBenefits] = useState((product.benefits ?? []).join(", "));
  const [priceNaira, setPriceNaira] = useState(String(product.price_naira));
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [onSale, setOnSale] = useState(product.on_sale);
  const [discountPercent, setDiscountPercent] = useState(
    product.discount_percent ? String(product.discount_percent) : ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [originalVariantIds, setOriginalVariantIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("product_variants")
      .select("id, label, price_naira")
      .eq("product_id", product.id)
      .order("sort_order")
      .then(({ data }) => {
        const rows = (data ?? []).map((v) => ({
          id: v.id as string,
          label: v.label as string,
          priceNaira: String(v.price_naira),
        }));
        setVariants(rows);
        setOriginalVariantIds(new Set(rows.map((r) => r.id)));
      });
  }, [product.id]);

  function onImageChange(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product name can't be empty.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let imageUrl = product.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${product.slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const updated = {
        name: name.trim(),
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
        image_url: imageUrl,
        category_id: categoryId || null,
        on_sale: onSale,
        discount_percent: onSale ? Number(discountPercent) || null : null,
      };
      const { error: updateError } = await supabase
        .from("products")
        .update(updated)
        .eq("id", product.id);
      if (updateError) throw updateError;
      await saveVariants(product.id, variants, originalVariantIds);
      const categoryName = categories.find((c) => c.id === categoryId)?.name ?? null;
      onSaved({ ...product, ...updated, categories: categoryName ? { name: categoryName } : null });
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-3">
      <div className="w-72">
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputClasses} mt-1`}
        />
      </div>
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Photo
        </label>
        <div className="mt-1 flex items-center gap-4">
          {(imagePreview ?? product.image_url) && (
            <div className="relative size-20 shrink-0 overflow-hidden rounded-panel">
              <Image
                src={imagePreview ?? product.image_url ?? ""}
                alt={product.name}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
            className="font-body text-small text-ink"
          />
        </div>
      </div>
      <div className="w-56">
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`${inputClasses} mt-1`}
        >
          <option value="">Uncategorised</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
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
        <p className="mt-1 font-body text-xs text-ink/50">Used when no sizes are added below.</p>
      </div>
      <div className="flex max-w-sm items-center justify-between rounded-panel border border-berry/15 bg-rose/20 px-4 py-3">
        <span className="font-body text-small font-medium text-ink">On Sale</span>
        <button
          type="button"
          role="switch"
          aria-checked={onSale}
          onClick={() => setOnSale((current) => !current)}
          className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors ${
            onSale ? "bg-berry" : "bg-clay/30"
          }`}
        >
          <span
            className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
              onSale ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {onSale && (
        <div className="w-48">
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Discount %
          </label>
          <input
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 20"
            className={`${inputClasses} mt-1`}
          />
          <p className="mt-1 font-body text-xs text-ink/50">
            Applies to the price above and every size below.
          </p>
        </div>
      )}
      <VariantsEditor variants={variants} onChange={setVariants} />
      {error && <p className="font-body text-small text-berry">{error}</p>}
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

function AddProductForm({
  categories,
  onAdded,
}: {
  categories: Category[];
  onAdded: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priceNaira, setPriceNaira] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(priceNaira);
    if (!name.trim() || !categoryId || !Number.isFinite(price) || price <= 0) {
      setError("Please fill in a name, category and a valid price.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const slug = slugify(name);
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const insertPayload = {
        slug,
        name: name.trim(),
        category_id: categoryId,
        description: description.trim() || null,
        ingredients: ingredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        benefits: benefits
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        image_url: imageUrl,
        price_naira: price,
      };
      const { data: created, error: insertError } = await supabase
        .from("products")
        .insert(insertPayload)
        .select("id, slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, categories(name)")
        .single<Product>();
      if (insertError) throw insertError;
      await saveVariants(created.id, variants, new Set());
      onAdded(created);
      setName("");
      setCategoryId("");
      setPriceNaira("");
      setDescription("");
      setIngredients("");
      setBenefits("");
      setImageFile(null);
      setVariants([]);
    } catch {
      setError("Could not add this product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-3">
      <p className="font-body text-small font-semibold text-ink/70">New product</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${inputClasses} mt-1`}
          />
        </div>
        <div>
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={`${inputClasses} mt-1`}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Photo
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1 font-body text-small text-ink"
        />
      </div>
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
        <p className="mt-1 font-body text-xs text-ink/50">Used when no sizes are added below.</p>
      </div>
      <VariantsEditor variants={variants} onChange={setVariants} />
      {error && <p className="font-body text-small text-berry">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-cocoa px-6 py-2 font-body text-small font-medium text-cream disabled:opacity-60"
      >
        {saving ? "Adding..." : "Add product"}
      </button>
    </form>
  );
}
