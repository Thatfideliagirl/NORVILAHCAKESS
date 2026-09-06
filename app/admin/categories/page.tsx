"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Category = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  function fetchCategories() {
    return supabase.from("categories").select("id, name, slug, active").order("sort_order");
  }

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
    await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name) });
    setName("");
    setSaving(false);
    fetchCategories().then(({ data }) => setCategories(data ?? []));
  }

  async function toggleActive(category: Category) {
    setCategories((current) =>
      current.map((c) => (c.id === category.id ? { ...c, active: !c.active } : c))
    );
    await supabase.from("categories").update({ active: !category.active }).eq("id", category.id);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Categories</p>

      <form onSubmit={addCategory} className="mt-6 flex max-w-md gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[420px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-clay/10 last:border-none">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
