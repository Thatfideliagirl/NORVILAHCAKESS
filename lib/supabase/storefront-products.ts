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
  on_sale: boolean;
  discount_percent: number | null;
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

export function useStorefrontProducts(): { products: Product[]; loading: boolean } {
  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from("products")
        .select(
          "id, slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, on_sale, discount_percent, categories(slug)"
        )
        .returns<DbProductRow[]>(),
      supabase
        .from("product_variants")
        .select("id, product_id, label, price_naira")
        .order("sort_order")
        .returns<DbVariantRow[]>(),
    ]).then(([{ data }, { data: variantRows }]) => {
      if (!data) {
        setLoading(false);
        return;
      }
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

      // A static seed product with no matching (active) DB row has been
      // deleted or deactivated from the admin -- drop it instead of
      // falling back to the hardcoded copy, otherwise deletions never
      // take visible effect on the storefront. Every other field is
      // taken from the DB row too, so admin edits (name, price,
      // description, category, sale) to a seed product show up here,
      // not just photo/variant swaps.
      const withImageOverrides: Product[] = staticProducts.flatMap((product) => {
        const dbRow = data.find((row) => row.slug === product.slug);
        if (!dbRow || !dbRow.active) return [];
        const dbVariants = variantsFor(dbRow);
        return [
          {
            ...product,
            name: dbRow.name,
            description: dbRow.description ?? product.description,
            ingredients: dbRow.ingredients ?? product.ingredients,
            benefits: dbRow.benefits ?? product.benefits,
            categorySlug: dbRow.categories?.slug ?? product.categorySlug,
            priceNaira: dbRow.price_naira,
            available: dbRow.active,
            featured: dbRow.featured,
            onSale: dbRow.on_sale,
            discountPercent: dbRow.discount_percent ?? undefined,
            ...(isUploadedImage(dbRow.image_url) ? { image: dbRow.image_url } : {}),
            ...(dbVariants ? { variants: dbVariants } : {}),
          },
        ];
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
          onSale: row.on_sale,
          discountPercent: row.discount_percent ?? undefined,
        }));

      setProducts([...withImageOverrides, ...addedByAdmin]);
      setLoading(false);
    });
  }, []);

  return { products, loading };
}
