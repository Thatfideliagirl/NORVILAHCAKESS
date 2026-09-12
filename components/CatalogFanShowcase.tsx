"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { revealContainer, revealUp } from "@/lib/motion";
import type { PriceList } from "@/lib/supabase/storefront-price-lists";

// The two-column catalog showcase: a fanned stack of category photos on
// one side, the write-up on the other. Used unchanged in two places --
// the landing-page teaser (with a "View Price List" button) and the
// /price-list page's own hero (without one, since the visitor is
// already there) -- so both read as the same catalog, continued.
export default function CatalogFanShowcase({
  priceLists,
  cta,
}: {
  priceLists: PriceList[];
  cta?: { href: string; label: string };
}) {
  const cards = priceLists.slice(0, 5);
  const centerIndex = Math.floor((cards.length - 1) / 2);

  return (
    <div className="mx-auto grid max-w-content items-center gap-14 px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
      <div className="relative mx-auto h-[340px] w-full max-w-sm md:h-[460px] md:max-w-none">
        {cards.map((priceList, index) => {
          const offset = index - centerIndex;
          const distance = Math.abs(offset);
          const scale = Math.max(1 - distance * 0.14, 0.62);
          return (
            <div
              key={priceList.id}
              className="absolute left-1/2 top-1/2 h-[230px] w-[164px] overflow-hidden rounded-panel shadow-warm-lg md:h-[320px] md:w-[220px]"
              style={{
                transform: `translate(-50%, -50%) translateX(${offset * 68}px) rotate(${offset * 7}deg) scale(${scale})`,
                zIndex: cards.length - distance,
                filter: distance === 0 ? "none" : `brightness(${1 - distance * 0.08}) saturate(0.85)`,
              }}
            >
              <Image
                src={priceList.image_url}
                alt={priceList.title}
                fill
                sizes="240px"
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
          Good taste, brighter days.
        </motion.p>
        <motion.p variants={revealUp} className="measure mx-auto mt-5 font-body text-lead text-plaster/90 md:mx-0">
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
