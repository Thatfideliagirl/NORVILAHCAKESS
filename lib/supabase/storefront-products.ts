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

function isUploadedImage(url: string | null): url is string {
  return !!url?.includes("/storage/v1/object/public/product-images/");
}

export function useStorefrontProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(staticProducts);

  useEffect(() => {
    supabase
      .from("products")
      .select(
        "slug, name, description, ingredients, benefits, image_url, price_naira, active, featured, categories(slug)"
      )
      .returns<DbProductRow[]>()
      .then(({ data }) => {
        if (!data) return;
        const staticSlugs = new Set(staticProducts.map((p) => p.slug));

        const withImageOverrides = staticProducts.map((product) => {
          const dbRow = data.find((row) => row.slug === product.slug);
          return isUploadedImage(dbRow?.image_url ?? null)
            ? { ...product, image: dbRow!.image_url as string }
            : product;
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
