"use client";

import CatalogFanShowcase from "@/components/CatalogFanShowcase";
import { useStorefrontPriceLists } from "@/lib/supabase/storefront-price-lists";

// Landing-page teaser -- the fanned cards + write-up. Clicking through
// takes customers to /price-list, where this exact same image becomes
// that page's own hero and the swipeable deck is the content below it.
export default function PriceListSection() {
  const { priceLists, loading } = useStorefrontPriceLists();

  // Nothing to show yet -- rather than a section with no content, this
  // one just doesn't render until Norvilah has added at least one
  // price list in Admin.
  if (loading || priceLists.length === 0) return null;

  return (
    // overflow-x-hidden matters here: the fan's outer cards sit wider
    // than their own container on a narrow phone, and without this the
    // whole homepage gains real horizontal scroll -- which is exactly
    // the kind of thing that can leave a later page's own layout
    // reading as shifted/inconsistent after navigating here first.
    <section id="catalog" className="overflow-x-hidden bg-cocoa py-28 md:py-36">
      <CatalogFanShowcase priceLists={priceLists} cta={{ href: "/price-list", label: "View Price List" }} />
    </section>
  );
}
