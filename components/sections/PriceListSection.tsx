"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { revealContainer, revealUp } from "@/lib/motion";
import { useStorefrontPriceLists } from "@/lib/supabase/storefront-price-lists";

// Landing-page teaser only -- a photo, a heading, and one button that
// takes customers to /price-list, where this same look becomes that
// page's hero and the swipeable deck is the actual content below it.
export default function PriceListSection() {
  const { priceLists, loading } = useStorefrontPriceLists();

  // Nothing to show yet -- rather than a section with no content, this
  // one just doesn't render until Norvilah has added at least one
  // price list in Admin.
  if (loading || priceLists.length === 0) return null;

  const backdrop =
    priceLists.find((p) => p.title.toLowerCase().includes("parfait"))?.image_url ??
    priceLists[0].image_url;

  return (
    <section id="catalog" className="relative overflow-hidden py-28 md:py-36">
      <div className="absolute inset-0 -z-20">
        <Image
          src={backdrop}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_25%]"
        />
      </div>
      {/* The same cocoa the rest of the site's dark sections use
          (Celebrations, the footer) -- a confident wash over the whole
          photo, darkest right behind the copy, but never so heavy the
          photo itself disappears. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cocoa/40 via-cocoa/50 to-cocoa/80" />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(65% 65% at 50% 55%, rgba(58,36,31,0.82) 0%, rgba(58,36,31,0.48) 60%, rgba(58,36,31,0.28) 100%)",
        }}
      />

      <motion.div
        variants={revealContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="relative mx-auto max-w-content px-6 text-center"
      >
        <motion.p
          variants={revealUp}
          className="inline-block rounded-pill bg-cream/90 px-4 py-1.5 font-body text-xs font-semibold uppercase tracking-[0.2em] text-ink shadow-warm"
        >
          A little more to crave
        </motion.p>
        <motion.h2
          variants={revealUp}
          className="mt-3 font-display text-heading text-cream drop-shadow-[0_2px_14px_rgba(58,36,31,0.9)] md:text-[4rem]"
        >
          The Norvilah Catalog
        </motion.h2>
        <motion.p
          variants={revealUp}
          className="mt-2 font-script text-2xl text-rose drop-shadow-[0_1px_8px_rgba(58,36,31,0.85)] md:text-3xl"
        >
          Good food, brighter days
        </motion.p>
        <motion.p
          variants={revealUp}
          className="measure mx-auto mt-5 font-body text-lead text-plaster/95 drop-shadow-[0_1px_6px_rgba(58,36,31,0.85)]"
        >
          Every category, every size, every price -- browse it like flipping
          through a deck of your favourite treats.
        </motion.p>
        <motion.div variants={revealUp}>
          <Link
            href="/price-list"
            className="mt-9 inline-block rounded-pill bg-cream px-8 py-3.5 font-body font-medium text-cocoa transition-colors duration-200 hover:bg-plaster"
          >
            View Price List
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
