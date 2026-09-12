"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { revealContainer, revealUp } from "@/lib/motion";
import { useStorefrontPriceLists } from "@/lib/supabase/storefront-price-lists";
import CatalogFanShowcase from "@/components/CatalogFanShowcase";
import PriceListCard from "@/components/PriceListCard";

export default function PriceListPage() {
  const { priceLists, loading } = useStorefrontPriceLists();
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = priceLists.length;

  function go(index: number) {
    const clamped = Math.max(0, Math.min(count - 1, index));
    setActive(clamped);
    const container = scrollRef.current;
    const child = container?.children[clamped] as HTMLElement | undefined;
    if (!container || !child) return;
    container.scrollTo({
      left: child.offsetLeft - (container.clientWidth - child.clientWidth) / 2,
      behavior: "smooth",
    });
  }

  // Tracks which card is centred as the visitor scrolls/swipes the row
  // by hand, so the arrows, dots and active-card styling stay in sync
  // with a plain native scroll instead of a custom drag gesture.
  function onScroll() {
    const container = scrollRef.current;
    if (!container) return;
    const center = container.scrollLeft + container.clientWidth / 2;
    let closest = 0;
    let closestDistance = Infinity;
    Array.from(container.children).forEach((node, index) => {
      const el = node as HTMLElement;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(elCenter - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    setActive(closest);
  }

  useEffect(() => {
    if (count === 0) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(active - 1);
      if (e.key === "ArrowRight") go(active + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, count]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cocoa">
        <p className="font-body text-body text-plaster/70">Loading...</p>
      </main>
    );
  }

  if (priceLists.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cocoa px-6 text-center">
        <p className="font-display text-heading text-cream">No price lists yet.</p>
        <Link href="/" className="font-body text-small font-medium text-plaster underline">
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-cocoa">
      {/* This page's own hero -- the exact same two-column catalog
          showcase as the landing page (image left, copy right), just
          without the button, since the visitor is already here. Reads
          as a continuation of that section, not a different design.
          Kept compact now that the header has its own solid backdrop
          rather than floating transparently over it. */}
      <section className="relative overflow-hidden bg-cocoa pb-5 pt-16 md:pb-6 md:pt-20">
        <div className="relative mx-auto max-w-content px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-small font-medium text-plaster transition-colors hover:text-cream"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Back to Home
          </Link>
        </div>
        <div className="mt-5">
          <CatalogFanShowcase priceLists={priceLists} />
        </div>
      </section>

      {/* The card row -- this page's actual content, on the same cream
          ground the admin panel uses. A flat, evenly-spaced row instead
          of an overlapping fan: every category is visible at once, the
          active one reads slightly larger, and it scrolls/snaps like a
          native carousel rather than a custom drag gesture. */}
      <section className="relative overflow-x-hidden bg-cream pb-24 pt-10 md:pb-32 md:pt-12">
        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-2xl px-6 text-center"
        >
          <motion.h2 variants={revealUp} className="font-display text-subheading text-berry">
            Swipe through &amp; see it all
          </motion.h2>
          <motion.p variants={revealUp} className="mt-2 font-body text-body text-ink/60">
            No extra clicks -- the price list lives right on the card.
          </motion.p>
        </motion.div>

        <div className="relative mt-10">
          <button
            type="button"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="Previous category"
            className="absolute left-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-cream text-ink shadow-warm transition-colors hover:border-berry hover:text-berry disabled:pointer-events-none disabled:opacity-30 md:left-6"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>

          <div
            ref={scrollRef}
            onScroll={onScroll}
            // Padding is exactly half a viewport minus half a card, not a
            // flat percentage -- that's what let the first/last card
            // still reach dead centre while leaving a huge, obviously
            // empty margin on wide screens (a flat vw value doesn't scale
            // with the fixed card width the way this calc does).
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50vw-100px)] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 md:px-[calc(50vw-120px)] [&::-webkit-scrollbar]:hidden"
          >
            {priceLists.map((priceList, index) => (
              <PriceListCard key={priceList.id} priceList={priceList} isActive={index === active} />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(active + 1)}
            disabled={active === count - 1}
            aria-label="Next category"
            className="absolute right-2 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/15 bg-cream text-ink shadow-warm transition-colors hover:border-berry hover:text-berry disabled:pointer-events-none disabled:opacity-30 md:right-6"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {priceLists.map((priceList, index) => (
            <button
              key={priceList.id}
              type="button"
              onClick={() => go(index)}
              aria-label={`Go to ${priceList.title}`}
              className={`size-2 rounded-full transition-colors ${
                index === active ? "bg-berry" : "bg-ink/15"
              }`}
            />
          ))}
        </div>
        <p className="mt-4 text-center font-body text-small text-ink/50">
          Swipe the cards, use the arrows, or your keyboard&apos;s arrow keys.
        </p>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-small font-medium text-ink/70 transition-colors hover:text-berry"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
