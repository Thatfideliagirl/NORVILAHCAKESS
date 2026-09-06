"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useFavourites() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [slugs, setSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      Promise.resolve().then(() => setSlugs(new Set()));
      return;
    }
    supabase
      .from("favourites")
      .select("product_slug")
      .eq("customer_id", userId)
      .then(({ data }) => setSlugs(new Set((data ?? []).map((row) => row.product_slug))));
  }, [userId]);

  async function toggle(slug: string): Promise<boolean> {
    if (!userId) return false;
    if (slugs.has(slug)) {
      await supabase.from("favourites").delete().eq("customer_id", userId).eq("product_slug", slug);
      setSlugs((current) => {
        const next = new Set(current);
        next.delete(slug);
        return next;
      });
    } else {
      await supabase.from("favourites").insert({ customer_id: userId, product_slug: slug });
      setSlugs((current) => new Set(current).add(slug));
    }
    return true;
  }

  return {
    isLoggedIn: Boolean(userId),
    isFavourite: (slug: string) => slugs.has(slug),
    toggle,
  };
}
