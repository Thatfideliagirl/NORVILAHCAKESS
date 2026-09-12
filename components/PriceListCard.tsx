"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { formatNaira } from "@/lib/format";
import type { PriceList } from "@/lib/supabase/storefront-price-lists";

export default function PriceListCard({
  priceList,
  rank,
  step,
}: {
  priceList: PriceList;
  rank: number;
  step: { x: number; y: number };
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visible = rank <= 3;

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
      className="absolute left-1/2 top-0 h-full w-[270px] -translate-x-1/2 overflow-hidden rounded-panel shadow-warm-lg transition-[transform,opacity,filter] duration-500 ease-out md:w-[300px]"
      style={{
        // The stack cascades in one direction only -- each card behind
        // the front one steps further down-and-left, instead of fanning
        // out symmetrically on both sides of it. That symmetric version
        // left two side cards reading as equally prominent, "competing"
        // for the middle instead of one clear card leading a single
        // stack that recedes to one side.
        transform: `translateX(calc(-50% - ${rank * step.x}px)) translateY(${
          rank * step.y
        }px) scale(${Math.max(1 - rank * 0.08, 0.7)}) rotate(${-rank * 4}deg)`,
        zIndex: 10 - rank,
        opacity: visible ? (rank === 0 ? 1 : rank === 1 ? 0.9 : rank === 2 ? 0.6 : 0.35) : 0,
        filter: rank === 0 ? "none" : `brightness(${1 - rank * 0.1}) saturate(0.85)`,
        pointerEvents: rank === 0 ? "auto" : "none",
      }}
    >
      <Image
        src={priceList.image_url}
        alt={priceList.title}
        fill
        sizes="300px"
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
        {/* Signals "there's more below" on long lists (e.g. Banana Bread's
            17 lines) instead of the list just abruptly stopping. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-panel bg-gradient-to-t from-cream/95 to-transparent" />
      </div>
    </div>
  );
}
