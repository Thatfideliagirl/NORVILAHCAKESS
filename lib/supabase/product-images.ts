"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Product photos/copy live in the static data/products.ts file, but an
// admin can replace a product's photo from the Admin > Products page,
// which uploads to Supabase Storage and saves the new URL on the
// matching products row. This hook fetches those uploaded overrides
// (keyed by slug) so the storefront can prefer them over the bundled
// static image.
export function useProductImageOverrides(): Record<string, string> {
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("products")
      .select("slug, image_url")
      .then(({ data }) => {
        const map: Record<string, string> = {};
        for (const row of data ?? []) {
          if (row.image_url?.includes("/storage/v1/object/public/product-images/")) {
            map[row.slug] = row.image_url;
          }
        }
        setOverrides(map);
      });
  }, []);

  return overrides;
}
