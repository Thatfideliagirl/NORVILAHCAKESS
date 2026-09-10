"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type Testimonial = { quote: string; name: string };

const FALLBACK: Testimonial[] = [
  { quote: "The parfaits are everything. So fresh and delicious.", name: "Teni A." },
  {
    quote: "Ordered for my sister birthday and it was perfect. Beautiful and tastes amazing.",
    name: "Chioma K.",
  },
  { quote: "Best meat pies in Lagos. Everyone at my event loved it.", name: "Daniel O." },
];

export function useStorefrontTestimonials(): Testimonial[] {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from("testimonials")
      .select("quote, name")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) setTestimonials(data);
      });
  }, []);

  return testimonials;
}
