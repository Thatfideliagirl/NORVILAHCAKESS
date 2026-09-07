import { useStorefrontCategories } from "@/lib/supabase/storefront-categories";

type CategorySidebarProps = {
  selected: string;
  onSelect: (slug: string) => void;
};

const ALL_ITEMS = { slug: "all", name: "All Items" };

// Desktop: a left-hand vertical list, never moved to the top, per the
// client's explicit instruction. Mobile: the same list turned into a
// horizontal, swipeable pill row instead of being squeezed into the
// sidebar shape.
export default function CategorySidebar({ selected, onSelect }: CategorySidebarProps) {
  const categories = useStorefrontCategories();
  const items = [ALL_ITEMS, ...categories];

  return (
    <nav aria-label="Menu categories">
      <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const isSelected = selected === item.slug;
          return (
            <button
              key={item.slug}
              type="button"
              onClick={() => onSelect(item.slug)}
              aria-pressed={isSelected}
              className={`shrink-0 whitespace-nowrap rounded-pill border px-4 py-2 font-body text-small transition-colors duration-200 ${
                isSelected
                  ? "border-berry bg-berry text-cream"
                  : "border-clay/30 text-ink hover:border-clay"
              }`}
            >
              {item.name}
            </button>
          );
        })}
      </div>

      <ul className="hidden flex-col gap-2 md:flex">
        {items.map((item) => {
          const isSelected = selected === item.slug;
          return (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onSelect(item.slug)}
                aria-pressed={isSelected}
                className={`w-full rounded-panel px-4 py-3 text-left font-body text-small transition-colors duration-200 ${
                  isSelected
                    ? "bg-berry text-cream"
                    : "bg-rose/20 text-ink hover:bg-rose/40"
                }`}
              >
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
