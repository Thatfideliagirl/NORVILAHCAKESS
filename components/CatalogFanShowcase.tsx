"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { revealContainer, revealUp } from "@/lib/motion";
import type { PriceList } from "@/lib/supabase/storefront-price-lists";

// The split layout: a fanned stack of category photos on one side, the
// write-up on the other. Used both as the landing-page teaser (with a
// CTA) and, unchanged, as this same image becoming the /price-list
// page's own hero (without one).
//
// The fan deliberately cascades in ONE direction only -- each card
// behind the front one steps further down-and-left and gets smaller and
// dimmer. Earlier drafts fanned symmetrically from a centre card, which
// left two side cards reading as equally prominent and "competing" for
// the middle instead of one clear card leading a stack.
export default function CatalogFanShowcase({
  priceLists,
  cta,
}: {
  priceLists: PriceList[];
  cta?: { href: string; label: string };
}) {
  const cards = priceLists.slice(0, 5);

  return (
    <div className="mx-auto grid max-w-content items-center gap-14 px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
      <div className="relative mx-auto h-[320px] w-full max-w-sm md:h-[420px] md:max-w-none">
        {cards.map((priceList, index) => {
          const rank = index;
          const scale = Math.max(1 - rank * 0.07, 0.72);
          return (
            <div
              key={priceList.id}
              className="absolute left-1/2 top-1/2 h-[220px] w-[160px] overflow-hidden rounded-panel shadow-warm-lg md:h-[300px] md:w-[210px]"
              style={{
                transform: `translate(-50%, -50%) translate(${-rank * 26}px, ${rank * 18}px) rotate(${-rank * 5}deg) scale(${scale})`,
                zIndex: cards.length - rank,
                filter: rank === 0 ? "none" : `brightness(${1 - rank * 0.1}) saturate(0.85)`,
              }}
            >
              <Image
                src={priceList.image_url}
                alt={priceList.title}
                fill
                sizes="220px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/15 via-cocoa/45 to-cocoa/75" />
              <div className="absolute inset-x-3 bottom-3">
                <h4 className="font-display text-product text-cream drop-shadow-[0_2px_8px_rgba(58,36,31,0.85)]">
                  {priceList.title}
                </h4>
                {priceList.tagline && (
                  <p className="mt-0.5 line-clamp-1 font-body text-xs text-plaster/90 drop-shadow-[0_1px_6px_rgba(58,36,31,0.85)]">
                    {priceList.tagline}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <motion.div
        variants={revealContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="text-center md:text-left"
      >
        <motion.p
          variants={revealUp}
          className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-plaster"
        >
          The Norvilah Catalog
        </motion.p>
        <motion.h2 variants={revealUp} className="mt-3 font-display text-heading text-cream md:text-[3.75rem]">
          A little more
          <br />
          to crave
        </motion.h2>
        <motion.p variants={revealUp} className="mt-2 font-script text-2xl text-rose md:text-3xl">
          Good food, brighter days
        </motion.p>
        <motion.p
          variants={revealUp}
          className="measure mx-auto mt-5 font-body text-lead text-plaster/90 md:mx-0"
        >
          Every category, every size, every price -- browse it like flipping
          through a deck of your favourite treats.
        </motion.p>
        {cta && (
          <motion.div variants={revealUp}>
            <Link
              href={cta.href}
              className="mt-9 inline-block rounded-pill bg-cream px-8 py-3.5 font-body font-medium text-cocoa transition-colors duration-200 hover:bg-plaster"
            >
              {cta.label}
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
