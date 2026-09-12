"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type PriceListItem = {
  id: string;
  group_label: string | null;
  label: string;
  price_naira: number;
  contents: string | null;
};

export type PriceList = {
  id: string;
  title: string;
  tagline: string | null;
  image_url: string;
  items: PriceListItem[];
};

type ItemRow = PriceListItem & { sort_order: number };

type Row = {
  id: string;
  title: string;
  tagline: string | null;
  image_url: string;
  price_list_items: ItemRow[];
};

// No hardcoded fallback here (unlike FAQs/testimonials) -- until
// Norvilah has added at least one, the section simply doesn't render
// rather than show an empty catalog.
export function useStorefrontPriceLists(): { priceLists: PriceList[]; loading: boolean } {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("price_lists")
      .select(
        "id, title, tagline, image_url, price_list_items(id, group_label, label, price_naira, contents, sort_order)"
      )
      .eq("active", true)
      .order("sort_order")
      .returns<Row[]>()
      .then(({ data }) => {
        setPriceLists(
          (data ?? []).map((row) => ({
            ...row,
            items: [...row.price_list_items].sort((a, b) => a.sort_order - b.sort_order),
          }))
        );
        setLoading(false);
      });
  }, []);

  return { priceLists, loading };
}
