import type { Product } from "@/data/products";
import { formatNaira } from "@/lib/format";

export type SortOption = "featured" | "price-asc" | "price-desc" | "name";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A to Z" },
];

export function lowestPrice(product: Product): number {
  if (!product.variants || product.variants.length === 0) return product.priceNaira;
  return Math.min(...product.variants.map((v) => v.priceNaira));
}

export function priceLabel(product: Product): string {
  if (!product.variants || product.variants.length === 0) {
    return formatNaira(product.priceNaira);
  }
  return `From ${formatNaira(lowestPrice(product))}`;
}

export function filterAndSortProducts(
  products: Product[],
  { category, query, sort }: { category: string; query: string; sort: SortOption }
): Product[] {
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (!product.available) return false;
    if (category !== "all" && product.categorySlug !== category) return false;
    if (
      normalizedQuery &&
      !product.name.toLowerCase().includes(normalizedQuery) &&
      !product.description.toLowerCase().includes(normalizedQuery)
    ) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered];
  switch (sort) {
    case "price-asc":
      sorted.sort((a, b) => lowestPrice(a) - lowestPrice(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => lowestPrice(b) - lowestPrice(a));
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "featured":
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
  }

  return sorted;
}
