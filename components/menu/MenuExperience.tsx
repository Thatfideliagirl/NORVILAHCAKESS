"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { products } from "@/data/products";
import { menuCategories } from "@/data/categories";
import { filterAndSortProducts, SORT_OPTIONS, type SortOption } from "@/lib/menu";
import CategorySidebar from "@/components/menu/CategorySidebar";
import ProductRow from "@/components/menu/ProductRow";
import ProductDetailModal from "@/components/menu/ProductDetailModal";

export default function MenuExperience() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") ?? "all";

  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, { category, query, sort }),
    [category, query, sort]
  );

  const activeIndex = filteredProducts.findIndex((p) => p.id === activeProductId);
  const activeProduct = activeIndex >= 0 ? filteredProducts[activeIndex] : null;

  const categoryName =
    category === "all"
      ? "All Items"
      : menuCategories.find((c) => c.slug === category)?.name ?? "All Items";

  return (
    <section className="bg-cream py-12 md:py-16">
      <div className="mx-auto max-w-content px-6 lg:px-11">
        <div className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-12">
          <div className="md:sticky md:top-28 md:self-start">
            <CategorySidebar selected={category} onSelect={setCategory} />
          </div>

          <div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-body text-small uppercase tracking-[0.12em] text-clay">
                  Explore Our Menu
                </p>
                <h2 className="mt-2 font-display text-product text-berry sm:text-heading">
                  {category === "all" ? "Treat Yourself to Something Special." : categoryName}
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-clay"
                    strokeWidth={1.75}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a treat..."
                    aria-label="Search the menu"
                    className="w-full rounded-pill border border-clay/30 bg-white/60 py-2.5 pl-10 pr-4 font-body text-small text-ink placeholder:text-ink/45 sm:w-56"
                  />
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  aria-label="Sort the menu"
                  className="rounded-pill border border-clay/30 bg-white/60 px-4 py-2.5 font-body text-small text-ink"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8">
              {filteredProducts.length === 0 ? (
                <p className="py-16 text-center font-body text-lead text-ink/60">
                  Nothing matches just yet — try a different search or category.
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    product={product}
                    onOpen={() => setActiveProductId(product.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductDetailModal
        product={activeProduct}
        hasPrevious={activeIndex > 0}
        hasNext={activeIndex >= 0 && activeIndex < filteredProducts.length - 1}
        onPrevious={() => setActiveProductId(filteredProducts[activeIndex - 1]?.id ?? null)}
        onNext={() => setActiveProductId(filteredProducts[activeIndex + 1]?.id ?? null)}
        onClose={() => setActiveProductId(null)}
      />
    </section>
  );
}
