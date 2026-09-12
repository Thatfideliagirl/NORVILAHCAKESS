"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { revealContainer, revealUp } from "@/lib/motion";
import { useStorefrontPriceLists } from "@/lib/supabase/storefront-price-lists";
import PriceListCard from "@/components/PriceListCard";

const SWIPE_THRESHOLD = 50;

export default function PriceListPage() {
  const { priceLists, loading } = useStorefrontPriceLists();
  const [active, setActive] = useState(0);
  const [spacing, setSpacing] = useState(130);
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

  // Neighbouring cards should only ever peek in from the edges, never
  // crowd the active one -- on a narrow phone screen the same fixed
  // spacing used on desktop pushed them close enough to make the
  // centred card look off-centre.
  useEffect(() => {
    function onResize() {
      setSpacing(window.innerWidth < 640 ? 78 : 130);
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
  const heroImage =
    priceLists.find((p) => p.title.toLowerCase().includes("parfait"))?.image_url ??
    priceLists[0].image_url;

  // Loops around instead of stopping at the ends -- with a plain
  // index-based offset, being on the first or last card left every
  // neighbour bunched on one side (nothing exists "before" card 0),
  // which is exactly what read as "everything is on this side, not in
  // the middle." Wrapping keeps the fan balanced on both sides no
  // matter which card is active.
  function go(index: number) {
    setActive(((index % count) + count) % count);
  }

  function wrappedOffset(index: number) {
    let diff = index - clampedActive;
    if (diff > count / 2) diff -= count;
    if (diff < -count / 2) diff += count;
    return diff;
  }

  // Plain touch tracking instead of a draggable transform on the deck
  // itself -- there is nothing here to ever get left mid-slide, so the
  // active card can't end up sitting off its centred position the way a
  // stuck drag offset could. Each card still animates via its own
  // transition when the offset changes.
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
      {/* This page's own hero -- same look as the landing-page teaser. */}
      <section className="relative overflow-hidden pb-20 pt-32 md:pb-24 md:pt-40">
        <div className="absolute inset-0 -z-20">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_25%]"
          />
        </div>
        {/* The same cocoa the rest of the site's dark sections use
            (Celebrations, the footer) -- a confident wash over the whole
            photo, darkest right behind the copy, but never so heavy the
            photo itself disappears. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cocoa/45 via-cocoa/55 to-cocoa/85" />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(65% 65% at 50% 60%, rgba(58,36,31,0.85) 0%, rgba(58,36,31,0.5) 60%, rgba(58,36,31,0.3) 100%)",
          }}
        />

        <div className="relative mx-auto max-w-content px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-small font-medium text-plaster drop-shadow-[0_1px_6px_rgba(58,36,31,0.85)] transition-colors hover:text-cream"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Back to Home
          </Link>
        </div>

        <motion.div
          variants={revealContainer}
          initial="hidden"
          animate="show"
          className="relative mx-auto mt-8 max-w-content px-6 text-center"
        >
          <motion.p
            variants={revealUp}
            className="inline-block rounded-pill bg-cream/90 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-ink shadow-warm"
          >
            A little more to crave
          </motion.p>
          <motion.h1
            variants={revealUp}
            className="mt-3 font-display text-heading text-cream drop-shadow-[0_2px_14px_rgba(58,36,31,0.9)] md:text-[4rem]"
          >
            The Norvilah Catalog
          </motion.h1>
          <motion.p
            variants={revealUp}
            className="mt-2 font-script text-2xl text-rose drop-shadow-[0_1px_8px_rgba(58,36,31,0.85)] md:text-3xl"
          >
            Good food, brighter days
          </motion.p>
        </motion.div>
      </section>

      {/* The swipeable deck -- this page's actual content. Clipped on the
          x-axis: the un-shown neighbour cards sit far enough off either
          side that, left unclipped, they widen the page's own scrollable
          area and the "centred" card ends up reading as off-centre once
          the phone lets you drag that extra width into view. */}
      <section className="relative overflow-x-hidden pb-24 pt-16 md:pb-32">
        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-content px-6 text-center"
        >
          <motion.h2 variants={revealUp} className="font-display text-subheading text-cream">
            Swipe through &amp; see it all
          </motion.h2>
          <motion.p variants={revealUp} className="mt-2 font-body text-body text-plaster/80">
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
              offset={wrappedOffset(index)}
              spacing={spacing}
            />
          ))}
        </div>

        <div className="mt-9 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => go(clampedActive - 1)}
            aria-label="Previous category"
            className="flex size-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:border-rose hover:bg-cream/10"
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
                  index === clampedActive ? "bg-rose" : "bg-cream/25"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(clampedActive + 1)}
            aria-label="Next category"
            className="flex size-11 items-center justify-center rounded-full border border-cream/25 text-cream transition-colors hover:border-rose hover:bg-cream/10"
          >
            <ChevronRight className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        <p className="mt-4 text-center font-body text-small text-plaster/60">
          Swipe the cards, use the arrows, or your keyboard&apos;s arrow keys.
        </p>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-small font-medium text-plaster transition-colors hover:text-cream"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
