"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { products as staticProducts, type Product } from "@/data/products";

// Product copy/pricing for the original catalogue lives in the static
// data/products.ts file, but two things can now happen from the Admin
// Products page: an existing product's photo can be replaced (uploaded
// to Supabase Storage), and a brand new product can be added outright.
// This hook merges both onto the static list so the storefront (menu,
// cart, checkout) reflects what the admin actually did, without a full
// migration of the original catalogue off the static file.
type DbProductRow = {
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
  categories: { slug: string } | null;
};

type DbVariantRow = {
  id: string;
  product_id: string;
  label: string;
  price_naira: number;
};

function isUploadedImage(url: string | null): url is string {
  return !!url?.includes("/storage/v1/object/public/product-images/");
}

export function useStorefrontProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(staticProducts);

  useEffect(() => {
    Promise.all([
      supabase
        .from("products")
        .select(
          "id, slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, categories(slug)"
        )
        .returns<DbProductRow[]>(),
      supabase
        .from("product_variants")
        .select("id, product_id, label, price_naira")
        .order("sort_order")
        .returns<DbVariantRow[]>(),
    ]).then(([{ data }, { data: variantRows }]) => {
      if (!data) return;
      const staticSlugs = new Set(staticProducts.map((p) => p.slug));
      const variantsByProductId = new Map<string, DbVariantRow[]>();
      for (const row of variantRows ?? []) {
        const list = variantsByProductId.get(row.product_id) ?? [];
        list.push(row);
        variantsByProductId.set(row.product_id, list);
      }
      function variantsFor(dbRow: DbProductRow | undefined) {
        const rows = dbRow ? variantsByProductId.get(dbRow.id) : undefined;
        return rows?.length
          ? rows.map((v) => ({ id: v.id, label: v.label, priceNaira: v.price_naira }))
          : undefined;
      }

      const withImageOverrides = staticProducts.map((product) => {
        const dbRow = data.find((row) => row.slug === product.slug);
        const dbVariants = variantsFor(dbRow);
        return {
          ...product,
          ...(isUploadedImage(dbRow?.image_url ?? null) ? { image: dbRow!.image_url as string } : {}),
          ...(dbVariants ? { variants: dbVariants } : {}),
        };
      });

      const addedByAdmin: Product[] = data
        .filter((row) => !staticSlugs.has(row.slug) && row.active && row.categories?.slug)
        .map((row) => ({
          id: row.slug,
          slug: row.slug,
          name: row.name,
          categorySlug: row.categories!.slug,
          description: row.description ?? "",
          image: row.image_url ?? "/products/cakes.jpg",
          priceNaira: row.price_naira,
          variants: variantsFor(row),
          ingredients: row.ingredients ?? undefined,
          benefits: row.benefits ?? undefined,
          available: row.active,
          featured: row.featured,
        }));

      setProducts([...withImageOverrides, ...addedByAdmin]);
    });
  }, []);

  return products;
}
