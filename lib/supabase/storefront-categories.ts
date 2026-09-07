"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { categories as staticCategories, type Category } from "@/data/categories";

type DbCategoryRow = {
  slug: string;
  name: string;
  blurb: string | null;
  image_url: string | null;
  sort_order: number;
};

// Categories are managed in Admin -> Categories (name, image, delete) and
// live in the database. The static list in data/categories.ts is only a
// fallback shown until this loads, so the site never renders empty.
export function useStorefrontCategories(): Category[] {
  const [categories, setCategories] = useState<Category[]>(staticCategories);

  useEffect(() => {
    supabase
      .from("categories")
      .select("slug, name, blurb, image_url, sort_order")
      .eq("active", true)
      .order("sort_order")
      .returns<DbCategoryRow[]>()
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setCategories(
          data.map((row) => ({
            slug: row.slug,
            name: row.name,
            image: row.image_url ?? "/products/cakes.jpg",
            blurb: row.blurb ?? "",
            order: row.sort_order,
          }))
        );
      });
  }, []);

  return categories;
}
