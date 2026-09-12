"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { revealContainer, revealUp } from "@/lib/motion";
import { useStorefrontPriceLists } from "@/lib/supabase/storefront-price-lists";
import CatalogFanShowcase from "@/components/CatalogFanShowcase";
import PriceListCard from "@/components/PriceListCard";

const SWIPE_THRESHOLD = 50;

export default function PriceListPage() {
  const { priceLists, loading } = useStorefrontPriceLists();
  const [active, setActive] = useState(0);
  const [step, setStep] = useState({ x: 34, y: 22 });
  const touchStartX = useRef<number | null>(null);
  const count = priceLists.length;

  useEffect(() => {
    if (count === 0) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setActive((current) => (current - 1 + count) % count);
      if (e.key === "ArrowRight") setActive((current) => (current + 1) % count);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [count]);

  useEffect(() => {
    function onResize() {
      setStep(window.innerWidth < 640 ? { x: 22, y: 16 } : { x: 34, y: 22 });
    }
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const clampedActive = ((active % count) + count) % count;

  function go(index: number) {
    setActive(((index % count) + count) % count);
  }

  // Rank 0 is always the front (active) card. The rest count up in a
  // fixed rotation, so moving to the next category sends the old front
  // card to the very back of the stack rather than mirroring it out to
  // the opposite side -- a single stack cascading one way, instead of
  // two cards fanned symmetrically and competing to read as "the middle
  // one."
  function rankOf(index: number) {
    return (index - clampedActive + count) % count;
  }

  function onTouchStart(e: TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -SWIPE_THRESHOLD) go(clampedActive + 1);
    else if (delta > SWIPE_THRESHOLD) go(clampedActive - 1);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-cocoa">
      {/* This page's own hero -- the exact same fanned-cards image as the
          landing-page teaser, just without its button. */}
      <section className="relative overflow-hidden bg-cocoa pb-20 pt-32 md:pb-24 md:pt-40">
        <div className="relative mx-auto max-w-content px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-small font-medium text-plaster transition-colors hover:text-cream"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Back to Home
          </Link>
        </div>
        <div className="mt-8">
          <CatalogFanShowcase priceLists={priceLists} />
        </div>
      </section>

      {/* The swipeable deck -- this page's actual content, on the same
          cream ground the admin panel uses. Clipped on the x-axis: cards
          further back in the stack sit off to one side, and left
          unclipped they'd widen the page's own scrollable area. */}
      <section className="relative overflow-x-hidden bg-cream pb-24 pt-16 md:pb-32">
        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-content px-6 text-center"
        >
          <motion.h2 variants={revealUp} className="font-display text-subheading text-berry">
            Swipe through &amp; see it all
          </motion.h2>
          <motion.p variants={revealUp} className="mt-2 font-body text-body text-ink/60">
            No extra clicks -- the price list lives right on the card.
          </motion.p>
        </motion.div>

        <div
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="relative mx-auto mt-14 h-[560px] max-w-content cursor-grab touch-pan-y active:cursor-grabbing md:h-[600px]"
        >
          {priceLists.map((priceList, index) => (
            <PriceListCard
              key={priceList.id}
              priceList={priceList}
              rank={rankOf(index)}
              step={step}
            />
          ))}
        </div>

        <div className="mt-9 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => go(clampedActive - 1)}
            aria-label="Previous category"
            className="flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-berry hover:text-berry"
          >
            <ChevronLeft className="size-5" strokeWidth={1.75} />
          </button>
          <div className="flex gap-2">
            {priceLists.map((priceList, index) => (
              <button
                key={priceList.id}
                type="button"
                onClick={() => go(index)}
                aria-label={`Go to ${priceList.title}`}
                className={`size-2 rounded-full transition-colors ${
                  index === clampedActive ? "bg-berry" : "bg-ink/15"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(clampedActive + 1)}
            aria-label="Next category"
            className="flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-berry hover:text-berry"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
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
