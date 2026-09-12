"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { PriceList } from "@/lib/supabase/storefront-price-lists";

// A flat card in an evenly-spaced horizontal row -- no rotation, no
// steep overlap. The active card just reads slightly larger and
// brighter than its neighbours, matching the reference image exactly.
export default function PriceListCard({
  priceList,
  isActive,
}: {
  priceList: PriceList;
  isActive: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="h-[440px] w-[240px] shrink-0 snap-center overflow-hidden rounded-panel shadow-warm-lg transition-[transform,opacity,filter] duration-300 ease-out md:h-[480px] md:w-[240px]"
      style={{
        transform: isActive ? "scale(1.08)" : "scale(0.92)",
        opacity: isActive ? 1 : 0.75,
        filter: isActive ? "none" : "brightness(0.85) saturate(0.9)",
        zIndex: isActive ? 10 : 1,
      }}
    >
      <div className="relative h-full w-full">
        <Image
          src={priceList.image_url}
          alt={priceList.title}
          fill
          sizes="240px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/10 via-cocoa/55 to-cocoa/85" />
        <div className="absolute inset-x-4 top-5">
          <h4 className="font-display text-subheading text-cream drop-shadow-[0_2px_8px_rgba(58,36,31,0.85)]">
            {priceList.title}
          </h4>
          {priceList.tagline && (
            <p className="mt-0.5 font-script text-xl text-rose drop-shadow-[0_1px_6px_rgba(58,36,31,0.85)]">
              {priceList.tagline}
            </p>
          )}
        </div>

        <div className="absolute inset-x-3 bottom-3 max-h-[68%] rounded-panel bg-cream/90 text-left backdrop-blur-sm">
          <div className="max-h-full overflow-y-auto p-4 pb-6">
            {priceList.items.map((item, index) => {
              const prevGroup = index > 0 ? priceList.items[index - 1].group_label : null;
              const showGroupHeading = item.group_label && item.group_label !== prevGroup;
              const isOpen = expanded.has(item.id);
              return (
                <div key={item.id}>
                  {showGroupHeading && (
                    <p className="mb-1 mt-3 font-body text-[11px] font-bold uppercase tracking-wide text-ink/50 first:mt-0">
                      {item.group_label}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2 border-b border-dotted border-ink/15 py-1 font-body text-small last:border-none">
                    {item.contents ? (
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-label={isOpen ? "Hide what's included" : "Show what's included"}
                        className="flex size-4 shrink-0 items-center justify-center rounded-full bg-berry/15 text-berry"
                      >
                        <ChevronDown
                          className={`size-2.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          strokeWidth={2.5}
                        />
                      </button>
                    ) : (
                      <span className="size-4 shrink-0" />
                    )}
                    <span className="font-medium text-ink">{item.label}</span>
                    <span className="flex-1 border-b border-dotted border-ink/25 translate-y-[-4px]" />
                    <span className="whitespace-nowrap font-semibold text-berry">
                      {formatNaira(item.price_naira)}
                    </span>
                  </div>
                  {item.contents && isOpen && (
                    <p className="mb-1 mt-0.5 pl-6 font-body text-xs leading-relaxed text-ink/60">
                      {item.contents}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {/* Signals "there's more below" on long lists (e.g. Banana
              Bread's 17 lines) instead of the list just abruptly
              stopping. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-panel bg-gradient-to-t from-cream/95 to-transparent" />
        </div>
      </div>
    </div>
  );
}
