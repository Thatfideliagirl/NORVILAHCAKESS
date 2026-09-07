"use client";

import { Fragment, useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Category = {
  id: string;
  name: string;
  slug: string;
  blurb: string | null;
  image_url: string | null;
  sort_order: number;
  active: boolean;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-3 py-2 font-body text-small text-ink";

function fetchCategories() {
  return supabase
    .from("categories")
    .select("id, name, slug, blurb, image_url, sort_order, active")
    .order("sort_order")
    .returns<Category[]>();
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [blurb, setBlurb] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setCategories(data ?? []);
    });
  }, []);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const slug = slugify(name);
        const ext = imageFile.name.split(".").pop();
        const path = `categories/${slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const nextSortOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1;
      await supabase.from("categories").insert({
        name: name.trim(),
        slug: slugify(name),
        blurb: blurb.trim() || null,
        image_url: imageUrl,
        sort_order: nextSortOrder,
      });
      setName("");
      setBlurb("");
      setImageFile(null);
      fetchCategories().then(({ data }) => setCategories(data ?? []));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: Category) {
    setCategories((current) =>
      current.map((c) => (c.id === category.id ? { ...c, active: !c.active } : c))
    );
    await supabase.from("categories").update({ active: !category.active }).eq("id", category.id);
  }

  async function deleteCategory(category: Category) {
    if (
      !window.confirm(
        `Delete "${category.name}"? Products in this category will be kept but unassigned.`
      )
    )
      return;
    setCategories((current) => current.filter((c) => c.id !== category.id));
    await supabase.from("categories").delete().eq("id", category.id);
  }

  function onSaved(updated: Category) {
    setCategories((current) => current.map((c) => (c.id === updated.id ? updated : c)));
    setEditingId(null);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Categories</p>
      <p className="mt-2 font-body text-body text-ink/60">
        These show up as the scrolling strip on the homepage and the menu sidebar. Deleting one
        removes it from both; products in it are kept, just unassigned.
      </p>

      <form onSubmit={addCategory} className="mt-6 flex max-w-2xl flex-col gap-3 rounded-panel bg-plaster/25 p-5">
        <p className="font-body text-small font-semibold text-ink/70">New category</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Cakes)"
            className={inputClasses}
          />
          <input
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="Short blurb (optional)"
            className={inputClasses}
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
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-pill bg-cocoa px-6 py-2 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          {saving ? "Adding..." : "Add category"}
        </button>
      </form>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[560px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                  No categories yet.
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <Fragment key={category.id}>
                <tr className="border-b border-clay/10 last:border-none">
                  <td className="px-4 py-3">
                    {category.image_url && (
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-panel">
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{category.name}</td>
                  <td className="px-4 py-3 text-ink/60">{category.slug}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActive(category)}
                      className={`rounded-pill px-4 py-1.5 text-xs font-semibold ${
                        category.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
                      }`}
                    >
                      {category.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(editingId === category.id ? null : category.id)}
                        className="font-body text-small font-medium text-berry"
                      >
                        {editingId === category.id ? "Close" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategory(category)}
                        aria-label={`Delete ${category.name}`}
                        className="font-body text-small font-medium text-berry"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId === category.id && (
                  <tr className="border-b border-clay/10 last:border-none">
                    <td colSpan={5} className="bg-plaster/15 px-4 py-5">
                      <EditCategoryForm category={category} onSaved={onSaved} />
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

function EditCategoryForm({
  category,
  onSaved,
}: {
  category: Category;
  onSaved: (category: Category) => void;
}) {
  const [name, setName] = useState(category.name);
  const [blurb, setBlurb] = useState(category.blurb ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onImageChange(file: File | null) {
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let imageUrl = category.image_url;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `categories/${category.slug}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const updated = { name: name.trim(), blurb: blurb.trim() || null, image_url: imageUrl };
      const { error: updateError } = await supabase
        .from("categories")
        .update(updated)
        .eq("id", category.id);
      if (updateError) throw updateError;
      onSaved({ ...category, ...updated });
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3">
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Photo
        </label>
        <div className="mt-1 flex items-center gap-4">
          {(imagePreview ?? category.image_url) && (
            <div className="relative size-16 shrink-0 overflow-hidden rounded-panel">
              <Image
                src={imagePreview ?? category.image_url ?? ""}
                alt={category.name}
                fill
                sizes="64px"
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Name
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputClasses} mt-1`} />
        </div>
        <div>
          <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
            Blurb
          </label>
          <input value={blurb} onChange={(e) => setBlurb(e.target.value)} className={`${inputClasses} mt-1`} />
        </div>
      </div>
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
