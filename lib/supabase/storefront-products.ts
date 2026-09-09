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
        .order("sort_order")
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
      const staticBySlug = new Map(staticProducts.map((p) => [p.slug, p]));
      const variantsByProductId = new Map<string, DbVariantRow[]>();
      for (const row of variantRows ?? []) {
        const list = variantsByProductId.get(row.product_id) ?? [];
        list.push(row);
        variantsByProductId.set(row.product_id, list);
      }
      function variantsFor(dbRow: DbProductRow) {
        const rows = variantsByProductId.get(dbRow.id);
        return rows?.length
          ? rows.map((v) => ({ id: v.id, label: v.label, priceNaira: v.price_naira }))
          : undefined;
      }

      // The database (in admin's chosen sort_order) is the single
      // source of truth: a static seed product with no matching active
      // row here has been deleted or deactivated from admin, so it's
      // dropped rather than falling back to the hardcoded copy --
      // otherwise deletions would never take visible effect on the
      // storefront. `id` is kept stable off the static entry where one
      // exists (existing carts reference it), everything else comes
      // from the DB row, so admin edits show up immediately.
      const merged: Product[] = data.flatMap((row) => {
        if (!row.active) return [];
        const staticProduct = staticBySlug.get(row.slug);
        const categorySlug = row.categories?.slug ?? staticProduct?.categorySlug;
        if (!categorySlug) return [];
        const fallbackImage = staticProduct?.image ?? "/products/cakes.jpg";
        const dbVariants = variantsFor(row);
        return [
          {
            id: staticProduct?.id ?? row.slug,
            slug: row.slug,
            name: row.name,
            categorySlug,
            description: row.description ?? staticProduct?.description ?? "",
            image: isUploadedImage(row.image_url) ? row.image_url : fallbackImage,
            priceNaira: row.price_naira,
            variants: dbVariants ?? staticProduct?.variants,
            ingredients: row.ingredients ?? staticProduct?.ingredients ?? undefined,
            benefits: row.benefits ?? staticProduct?.benefits ?? undefined,
            available: row.active,
            featured: row.featured,
            onSale: row.on_sale,
            discountPercent: row.discount_percent ?? undefined,
          },
        ];
      });

      setProducts(merged);
      setLoading(false);
    });
  }, []);

  return { products, loading };
}
