"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { GripVertical, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { compressImage } from "@/lib/compress-image";
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
  min_select: number | null;
  sort_order: number;
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

// A single choice in a "Mix & Match" product -- e.g. one Banana Bread
// flavour. Unlike a Size, the customer can pick several of these at
// once, so each one carries its own photo and its own on/off switch
// (a flavour that's temporarily unavailable can be turned off without
// deleting it and losing its price history).
type OptionRow = {
  id: string | null;
  label: string;
  priceNaira: string;
  imageUrl: string | null;
  imageFile: File | null;
  imagePreview: string | null;
  active: boolean;
};

function newOptionRow(): OptionRow {
  return { id: null, label: "", priceNaira: "", imageUrl: null, imageFile: null, imagePreview: null, active: true };
}

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

function OptionsEditor({
  options,
  onChange,
}: {
  options: OptionRow[];
  onChange: (options: OptionRow[]) => void;
}) {
  function updateRow(index: number, patch: Partial<OptionRow>) {
    onChange(options.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  }

  function removeRow(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }

  function addRow() {
    onChange([...options, newOptionRow()]);
  }

  function onImageChange(index: number, file: File | null) {
    updateRow(index, { imageFile: file, imagePreview: file ? URL.createObjectURL(file) : null });
  }

  return (
    <div>
      <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
        Options -- what customers pick from
      </label>
      <p className="mt-1 font-body text-xs text-ink/50">
        Each one gets its own photo and price. Turn Off a flavour that&apos;s temporarily
        unavailable instead of deleting it.
      </p>
      <div className="mt-2 flex flex-col gap-2">
        {options.map((option, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2 rounded-panel border border-clay/15 bg-plaster/10 p-2">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-panel bg-plaster/40">
              {(option.imagePreview ?? option.imageUrl) && (
                <Image
                  src={option.imagePreview ?? option.imageUrl ?? ""}
                  alt={option.label || "Option"}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageChange(index, e.target.files?.[0] ?? null)}
              className="w-24 shrink-0 font-body text-xs text-ink"
            />
            <input
              value={option.label}
              onChange={(e) => updateRow(index, { label: e.target.value })}
              placeholder="e.g. Chocolate Chip"
              className={`${inputClasses} max-w-[160px]`}
            />
            <input
              value={option.priceNaira}
              onChange={(e) => updateRow(index, { priceNaira: e.target.value })}
              inputMode="numeric"
              placeholder="Price (₦)"
              className={`${inputClasses} max-w-[120px]`}
            />
            <button
              type="button"
              role="switch"
              aria-checked={option.active}
              aria-label={option.active ? "Turn this option off" : "Turn this option on"}
              onClick={() => updateRow(index, { active: !option.active })}
              className={`relative h-6 w-11 shrink-0 rounded-pill transition-colors ${
                option.active ? "bg-berry" : "bg-clay/30"
              }`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                  option.active ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label={`Delete ${option.label || "option"}`}
              className="ml-auto flex shrink-0 items-center gap-1 font-body text-small font-medium text-berry"
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
              Delete
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start font-body text-small font-medium text-cocoa"
        >
          + Add option
        </button>
      </div>
    </div>
  );
}

async function saveOptions(productId: string, options: OptionRow[], originalIds: Set<string>) {
  const usable = options.filter((o) => o.label.trim() && Number(o.priceNaira) > 0);
  const keptIds = new Set(usable.filter((o) => o.id).map((o) => o.id as string));
  const removedIds = Array.from(originalIds).filter((id) => !keptIds.has(id));

  if (removedIds.length > 0) {
    await supabase.from("product_options").delete().in("id", removedIds);
  }

  for (let i = 0; i < usable.length; i++) {
    const o = usable[i];
    let imageUrl = o.imageUrl;
    if (o.imageFile) {
      const compressed = await compressImage(o.imageFile);
      const ext = compressed.name.split(".").pop();
      const path = `options/${slugify(o.label)}-${Date.now()}-${i}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, compressed);
      if (uploadError) throw uploadError;
      imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      product_id: productId,
      label: o.label.trim(),
      price_naira: Number(o.priceNaira),
      image_url: imageUrl,
      active: o.active,
      sort_order: i,
    };
    if (o.id) {
      await supabase.from("product_options").update(payload).eq("id", o.id);
    } else {
      await supabase.from("product_options").insert(payload);
    }
  }
}

// The cheapest a Mix & Match product could possibly ring up -- its
// minSelect (or 1) cheapest active options added together. Saved to
// products.price_naira (which every product needs some value for)
// so nothing shows a blank/zero price before a customer has picked
// anything; the real total always comes from what they actually pick.
function cheapestOptionsTotal(options: OptionRow[], minSelect: number): number {
  const usable = options.filter((o) => o.active && o.label.trim() && Number(o.priceNaira) > 0);
  const prices = usable.map((o) => Number(o.priceNaira)).sort((a, b) => a - b);
  return prices.slice(0, Math.max(minSelect, 1)).reduce((sum, p) => sum + p, 0);
}

function CategoryCheckboxes({
  categories,
  selectedIds,
  onChange,
}: {
  categories: Category[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}) {
  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div>
      <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
        Categories
      </label>
      <p className="mt-1 font-body text-xs text-ink/50">
        Pick every category this product should show up under.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {categories.map((category) => {
          const isSelected = selectedIds.has(category.id);
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(category.id)}
              className={`rounded-pill border px-3.5 py-1.5 font-body text-small font-medium transition-colors ${
                isSelected
                  ? "border-berry bg-berry text-cream"
                  : "border-clay/30 text-ink/70 hover:border-clay"
              }`}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

async function saveProductCategories(productId: string, categoryIds: Set<string>, originalIds: Set<string>) {
  const toAdd = Array.from(categoryIds).filter((id) => !originalIds.has(id));
  const toRemove = Array.from(originalIds).filter((id) => !categoryIds.has(id));

  if (toRemove.length > 0) {
    await supabase
      .from("product_categories")
      .delete()
      .eq("product_id", productId)
      .in("category_id", toRemove);
  }
  if (toAdd.length > 0) {
    await supabase
      .from("product_categories")
      .insert(toAdd.map((categoryId) => ({ product_id: productId, category_id: categoryId })));
  }
}

function fetchProducts() {
  return supabase
    .from("products")
    .select(
      "id, slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, category_id, on_sale, discount_percent, min_select, sort_order, categories(name)"
    )
    .order("sort_order")
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
  const [dragIndex, setDragIndex] = useState<number | null>(null);

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
    setProducts((current) => [...current, created]);
    setAdding(false);
  }

  async function moveProduct(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    const reordered = [...products];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setProducts(reordered);
    await Promise.all(
      reordered.map((product, i) =>
        product.sort_order === i
          ? null
          : supabase.from("products").update({ sort_order: i }).eq("id", product.id)
      )
    );
  }

  const editingProduct = products.find((p) => p.id === editingId) ?? null;

  // Editing used to expand inline as an extra table row -- with the
  // rest of the list still showing below it, "edit" meant scrolling
  // past every other product to find the form. It now replaces the
  // whole list view instead, with its own way back.
  if (editingProduct) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setEditingId(null)}
          className="font-body text-small font-medium text-ink/60 hover:text-berry"
        >
          &larr; Back to Products
        </button>
        <div className="mt-4 rounded-panel bg-cream p-5 shadow-warm">
          <EditProductForm product={editingProduct} categories={categories} onSaved={onSaved} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-heading text-berry">Products</p>
          <p className="mt-2 font-body text-body text-ink/60">
            Turn a product off to hide it from the site without deleting it. Edit to update the
            description, ingredients, or Good to Know copy. Drag the ⠿ handle to reorder how
            products appear on the menu.
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
          <AddProductForm
            categories={categories}
            nextSortOrder={products.reduce((max, p) => Math.max(max, p.sort_order), 0) + 1}
            onAdded={onAdded}
          />
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[640px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium"></th>
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
                <td colSpan={7} className="px-4 py-8 text-center text-ink/50">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((product, index) => (
                <tr
                  key={product.id}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null) moveProduct(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  className={`border-b border-clay/10 last:border-none ${
                    dragIndex === index ? "opacity-40" : ""
                  }`}
                >
                  <td className="cursor-grab px-4 py-3 text-ink/30 active:cursor-grabbing">
                    <GripVertical className="size-4" strokeWidth={1.75} />
                  </td>
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
                        onClick={() => setEditingId(product.id)}
                        className="font-body text-small font-medium text-berry"
                      >
                        Edit
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
  const [categoryIds, setCategoryIds] = useState<Set<string>>(
    new Set(product.category_id ? [product.category_id] : [])
  );
  const [originalCategoryIds, setOriginalCategoryIds] = useState<Set<string>>(new Set());
  const [onSale, setOnSale] = useState(product.on_sale);
  const [discountPercent, setDiscountPercent] = useState(
    product.discount_percent ? String(product.discount_percent) : ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [originalVariantIds, setOriginalVariantIds] = useState<Set<string>>(new Set());
  const [pricingType, setPricingType] = useState<"regular" | "options">("regular");
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [originalOptionIds, setOriginalOptionIds] = useState<Set<string>>(new Set());
  const [minSelect, setMinSelect] = useState(String(product.min_select ?? 4));
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
    supabase
      .from("product_options")
      .select("id, label, price_naira, image_url, active")
      .eq("product_id", product.id)
      .order("sort_order")
      .then(({ data }) => {
        const rows = (data ?? []).map((o) => ({
          id: o.id as string,
          label: o.label as string,
          priceNaira: String(o.price_naira),
          imageUrl: o.image_url as string | null,
          imageFile: null,
          imagePreview: null,
          active: o.active as boolean,
        }));
        setOptions(rows);
        setOriginalOptionIds(new Set(rows.map((r) => r.id)));
        if (rows.length > 0) setPricingType("options");
      });
    supabase
      .from("product_categories")
      .select("category_id")
      .eq("product_id", product.id)
      .then(({ data }) => {
        const ids = new Set((data ?? []).map((r) => r.category_id as string));
        if (product.category_id) ids.add(product.category_id);
        setCategoryIds(ids);
        setOriginalCategoryIds(new Set(ids));
      });
  }, [product.id, product.category_id]);

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
    if (categoryIds.size === 0) {
      setError("Please pick at least one category.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let imageUrl = product.image_url;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const ext = compressed.name.split(".").pop();
        const path = `${product.slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, compressed);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const primaryCategoryId = categories.find((c) => categoryIds.has(c.id))?.id ?? null;
      const isOptions = pricingType === "options";
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
        price_naira: isOptions
          ? cheapestOptionsTotal(options, Number(minSelect) || 1)
          : Number(priceNaira) || product.price_naira,
        image_url: imageUrl,
        category_id: primaryCategoryId,
        on_sale: onSale,
        discount_percent: onSale ? Number(discountPercent) || null : null,
        min_select: isOptions ? Number(minSelect) || 1 : null,
      };
      const { error: updateError } = await supabase
        .from("products")
        .update(updated)
        .eq("id", product.id);
      if (updateError) throw updateError;
      if (isOptions) {
        await saveOptions(product.id, options, originalOptionIds);
        await saveVariants(product.id, [], originalVariantIds);
      } else {
        await saveVariants(product.id, variants, originalVariantIds);
        await saveOptions(product.id, [], originalOptionIds);
      }
      await saveProductCategories(product.id, categoryIds, originalCategoryIds);
      const categoryName = categories.find((c) => c.id === primaryCategoryId)?.name ?? null;
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
      <CategoryCheckboxes categories={categories} selectedIds={categoryIds} onChange={setCategoryIds} />
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

      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Pricing
        </label>
        <div className="mt-1 flex max-w-md gap-3">
          <button
            type="button"
            onClick={() => setPricingType("regular")}
            aria-pressed={pricingType === "regular"}
            className={`flex-1 rounded-panel border-2 p-3 text-left transition-colors ${
              pricingType === "regular" ? "border-berry bg-rose/15" : "border-clay/20"
            }`}
          >
            <p className="font-body text-small font-semibold text-ink">Regular</p>
            <p className="mt-0.5 font-body text-xs text-ink/55">
              One price, or a few fixed Sizes.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPricingType("options")}
            aria-pressed={pricingType === "options"}
            className={`flex-1 rounded-panel border-2 p-3 text-left transition-colors ${
              pricingType === "options" ? "border-berry bg-rose/15" : "border-clay/20"
            }`}
          >
            <p className="font-body text-small font-semibold text-ink">Mix &amp; Match</p>
            <p className="mt-0.5 font-body text-xs text-ink/55">
              Customer picks from a list of options, each its own price.
            </p>
          </button>
        </div>
      </div>

      {pricingType === "options" ? (
        <>
          <div className="w-56">
            <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
              Customer must pick at least
            </label>
            <input
              value={minSelect}
              onChange={(e) => setMinSelect(e.target.value)}
              inputMode="numeric"
              className={`${inputClasses} mt-1 max-w-[100px]`}
            />
            <p className="mt-1 font-body text-xs text-ink/50">
              They can always pick more, never less.
            </p>
          </div>
          <OptionsEditor options={options} onChange={setOptions} />
        </>
      ) : (
        <>
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
        </>
      )}
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
  nextSortOrder,
  onAdded,
}: {
  categories: Category[];
  nextSortOrder: number;
  onAdded: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [categoryIds, setCategoryIds] = useState<Set<string>>(new Set());
  const [priceNaira, setPriceNaira] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [benefits, setBenefits] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [pricingType, setPricingType] = useState<"regular" | "options">("regular");
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [minSelect, setMinSelect] = useState("4");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isOptions = pricingType === "options";
    const price = isOptions ? cheapestOptionsTotal(options, Number(minSelect) || 1) : Number(priceNaira);
    if (!name.trim() || categoryIds.size === 0) {
      setError("Please fill in a name and pick at least one category.");
      return;
    }
    if (!isOptions && (!Number.isFinite(price) || price <= 0)) {
      setError("Please enter a valid price.");
      return;
    }
    if (isOptions && options.filter((o) => o.label.trim() && Number(o.priceNaira) > 0).length === 0) {
      setError("Please add at least one option.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const slug = slugify(name);
      let imageUrl: string | null = null;
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const ext = compressed.name.split(".").pop();
        const path = `${slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, compressed);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const primaryCategoryId = categories.find((c) => categoryIds.has(c.id))?.id ?? null;
      const insertPayload = {
        slug,
        name: name.trim(),
        category_id: primaryCategoryId,
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
        min_select: isOptions ? Number(minSelect) || 1 : null,
        sort_order: nextSortOrder,
      };
      const { data: created, error: insertError } = await supabase
        .from("products")
        .insert(insertPayload)
        .select(
          "id, slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, category_id, on_sale, discount_percent, min_select, sort_order, categories(name)"
        )
        .single<Product>();
      if (insertError) throw insertError;
      if (isOptions) {
        await saveOptions(created.id, options, new Set());
      } else {
        await saveVariants(created.id, variants, new Set());
      }
      await saveProductCategories(created.id, categoryIds, new Set());
      onAdded(created);
      setName("");
      setCategoryIds(new Set());
      setPriceNaira("");
      setDescription("");
      setIngredients("");
      setBenefits("");
      setImageFile(null);
      setVariants([]);
      setOptions([]);
      setPricingType("regular");
      setMinSelect("4");
    } catch {
      setError("Could not add this product. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-2xl flex-col gap-3">
      <p className="font-body text-small font-semibold text-ink/70">New product</p>
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
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1 font-body text-small text-ink"
        />
      </div>
      <CategoryCheckboxes categories={categories} selectedIds={categoryIds} onChange={setCategoryIds} />
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

      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Pricing
        </label>
        <div className="mt-1 flex max-w-md gap-3">
          <button
            type="button"
            onClick={() => setPricingType("regular")}
            aria-pressed={pricingType === "regular"}
            className={`flex-1 rounded-panel border-2 p-3 text-left transition-colors ${
              pricingType === "regular" ? "border-berry bg-rose/15" : "border-clay/20"
            }`}
          >
            <p className="font-body text-small font-semibold text-ink">Regular</p>
            <p className="mt-0.5 font-body text-xs text-ink/55">
              One price, or a few fixed Sizes.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setPricingType("options")}
            aria-pressed={pricingType === "options"}
            className={`flex-1 rounded-panel border-2 p-3 text-left transition-colors ${
              pricingType === "options" ? "border-berry bg-rose/15" : "border-clay/20"
            }`}
          >
            <p className="font-body text-small font-semibold text-ink">Mix &amp; Match</p>
            <p className="mt-0.5 font-body text-xs text-ink/55">
              Customer picks from a list of options, each its own price.
            </p>
          </button>
        </div>
      </div>

      {pricingType === "options" ? (
        <>
          <div className="w-56">
            <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
              Customer must pick at least
            </label>
            <input
              value={minSelect}
              onChange={(e) => setMinSelect(e.target.value)}
              inputMode="numeric"
              className={`${inputClasses} mt-1 max-w-[100px]`}
            />
            <p className="mt-1 font-body text-xs text-ink/50">
              They can always pick more, never less.
            </p>
          </div>
          <OptionsEditor options={options} onChange={setOptions} />
        </>
      ) : (
        <>
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
        </>
      )}
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
