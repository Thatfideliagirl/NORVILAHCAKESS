"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue } from "framer-motion";
import { ArrowUp, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatNaira } from "@/lib/format";
import { revealContainer, revealUp } from "@/lib/motion";
import { useStorefrontPriceLists, type PriceList } from "@/lib/supabase/storefront-price-lists";

const CARD_SPACING = 130;
const SWIPE_THRESHOLD = 60;

export default function PriceListSection() {
  const { priceLists, loading } = useStorefrontPriceLists();
  const [active, setActive] = useState(0);
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

  // Nothing to show yet -- rather than a section with no content, this
  // one just doesn't render until Norvilah has added at least one
  // price list in Admin.
  if (loading || priceLists.length === 0) return null;

  const clampedActive = Math.min(active, priceLists.length - 1);
  const backdrop = priceLists[0].image_url;

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
    <>
      {/* Landing-page teaser -- a photo, a heading, and one button into
          the catalog below. */}
      <section id="catalog" className="relative overflow-hidden py-28 md:py-36">
        <div className="absolute inset-0 -z-20">
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cocoa/55 via-cocoa/70 to-cocoa/90" />

        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative mx-auto max-w-content px-6 text-center"
        >
          <motion.p
            variants={revealUp}
            className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-plaster"
          >
            A little more to crave
          </motion.p>
          <motion.h2
            variants={revealUp}
            className="mt-3 font-display text-heading text-cream md:text-[3.5rem]"
          >
            The Norvilah Catalog
          </motion.h2>
          <motion.p variants={revealUp} className="mt-2 font-script text-2xl text-rose md:text-3xl">
            Good food, brighter days
          </motion.p>
          <motion.p variants={revealUp} className="measure mx-auto mt-5 font-body text-lead text-plaster/90">
            Every category, every size, every price -- browse it like flipping
            through a deck of your favourite treats.
          </motion.p>
          <motion.a
            variants={revealUp}
            href="#catalog-deck"
            className="mt-9 inline-block rounded-pill bg-cream px-8 py-3.5 font-body font-medium text-cocoa transition-colors duration-200 hover:bg-plaster"
          >
            View Price List
          </motion.a>
        </motion.div>
      </section>

      {/* The swipeable deck itself. */}
      <section id="catalog-deck" className="bg-cocoa py-24 md:py-32">
        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto max-w-content px-6 text-center"
        >
          <motion.p
            variants={revealUp}
            className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-plaster"
          >
            Norvilah&apos;s Price List
          </motion.p>
          <motion.h3 variants={revealUp} className="mt-2 font-display text-subheading text-cream">
            Swipe through &amp; see it all
          </motion.h3>
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
            <PriceCard
              key={priceList.id}
              priceList={priceList}
              offset={index - clampedActive}
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
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 font-body text-small font-medium text-plaster transition-colors hover:text-cream"
          >
            <ArrowUp className="size-4" strokeWidth={1.75} />
            Back to Home
          </button>
        </div>
      </section>
    </>
  );
}

function PriceCard({ priceList, offset }: { priceList: PriceList; offset: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const visible = Math.abs(offset) <= 2;

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
        transform: `translateX(calc(-50% + ${offset * CARD_SPACING}px)) scale(${Math.max(
          1 - Math.abs(offset) * 0.14,
          0.62
        )}) rotate(${offset * 5}deg)`,
        zIndex: 10 - Math.abs(offset),
        opacity: visible ? (offset === 0 ? 1 : 0.55) : 0,
        filter: offset === 0 ? "none" : "brightness(0.7) saturate(0.85)",
        pointerEvents: offset === 0 ? "auto" : "none",
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
        <h4 className="font-display text-product text-cream">{priceList.title}</h4>
      </div>

      <div className="absolute inset-x-3 bottom-3 max-h-[62%] overflow-y-auto rounded-panel bg-cream/90 p-4 text-left backdrop-blur-sm">
        {priceList.tagline && (
          <p className="mb-2 font-body text-xs font-semibold text-berry">{priceList.tagline}</p>
        )}
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
                    <Plus
                      className={`size-2.5 transition-transform ${isOpen ? "rotate-45" : ""}`}
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
    </div>
  );
}
