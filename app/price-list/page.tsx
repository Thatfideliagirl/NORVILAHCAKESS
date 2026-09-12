"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { revealContainer, revealUp } from "@/lib/motion";
import { useStorefrontPriceLists } from "@/lib/supabase/storefront-price-lists";
import PriceListCard from "@/components/PriceListCard";

const SWIPE_THRESHOLD = 60;

export default function PriceListPage() {
  const { priceLists, loading } = useStorefrontPriceLists();
  const [active, setActive] = useState(0);
  const [spacing, setSpacing] = useState(130);
  const dragX = useMotionValue(0);
  const count = priceLists.length;

  useEffect(() => {
    if (count === 0) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setActive((current) => Math.max(0, current - 1));
      if (e.key === "ArrowRight") setActive((current) => Math.min(count - 1, current + 1));
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

  const clampedActive = Math.min(active, priceLists.length - 1);
  const heroImage =
    priceLists.find((p) => p.title.toLowerCase().includes("parfait"))?.image_url ??
    priceLists[0].image_url;

  function go(index: number) {
    setActive(Math.max(0, Math.min(priceLists.length - 1, index)));
  }

  function onDragEnd() {
    const delta = dragX.get();
    if (delta < -SWIPE_THRESHOLD) go(clampedActive + 1);
    else if (delta > SWIPE_THRESHOLD) go(clampedActive - 1);
    dragX.set(0);
  }

  return (
    <main className="min-h-screen bg-cocoa">
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
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cocoa/15 via-cocoa/40 to-cocoa" />

        <div className="relative mx-auto max-w-content px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-body text-small font-medium text-plaster transition-colors hover:text-cream"
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
            className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-plaster"
          >
            A little more to crave
          </motion.p>
          <motion.h1
            variants={revealUp}
            className="mt-3 font-display text-heading text-cream md:text-[4rem]"
          >
            The Norvilah Catalog
          </motion.h1>
          <motion.p variants={revealUp} className="mt-2 font-script text-2xl text-rose md:text-3xl">
            Good food, brighter days
          </motion.p>
        </motion.div>
      </section>

      {/* The swipeable deck -- this page's actual content. */}
      <section className="pb-24 pt-4 md:pb-32">
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

        <motion.div
          drag="x"
          dragElastic={0.15}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={onDragEnd}
          style={{ x: dragX }}
          className="relative mx-auto mt-14 h-[560px] max-w-content cursor-grab touch-pan-y active:cursor-grabbing md:h-[600px]"
        >
          {priceLists.map((priceList, index) => (
            <PriceListCard
              key={priceList.id}
              priceList={priceList}
              offset={index - clampedActive}
              spacing={spacing}
            />
          ))}
        </motion.div>

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
          Drag the cards, use the arrows, or your keyboard&apos;s arrow keys.
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
