"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Arch from "@/components/Arch";
import { categories, type Category } from "@/data/categories";
import { revealContainer, revealUp } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/menu?category=${category.slug}`}
      className="group block w-[150px] shrink-0 md:w-[180px] lg:w-[220px]"
    >
      <Arch
        src={category.image}
        alt={`${category.name}: ${category.blurb}`}
        sizes="(min-width: 1024px) 220px, (min-width: 768px) 180px, 150px"
        imageClassName="transition-transform duration-[450ms] ease-out group-hover:scale-105"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="font-display text-product text-ink transition-transform duration-[450ms] ease-out group-hover:translate-x-1">
          {category.name}
        </span>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-clay text-berry">
          <ArrowUpRight className="size-4" strokeWidth={1.5} />
        </span>
      </div>
    </Link>
  );
}

export default function CategoryStrip() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.section
      variants={revealContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="bg-cream py-24 md:py-32"
    >
      <motion.div variants={revealUp} className="mx-auto max-w-content px-6 text-center">
        <h2 className="font-display text-heading text-berry">
          What are you craving?
        </h2>
        <p className="mt-3 font-body text-lead text-ink/70">
          Explore our range, made fresh to order.
        </p>
      </motion.div>

      <motion.div variants={revealUp} className="relative mx-auto mt-12 max-w-content">
        {reducedMotion ? (
          <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 pb-4 [scrollbar-width:none] md:gap-6 lg:mx-auto lg:max-w-content [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <div key={category.slug} className="snap-start">
                <CategoryCard category={category} />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="flex w-max animate-marquee gap-5 px-6 pb-4 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] md:gap-6">
              {[...categories, ...categories].map((category, i) => (
                <CategoryCard key={`${category.slug}-${i}`} category={category} />
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={revealUp} className="mt-12 flex justify-center px-6">
        <Link
          href="/menu"
          className="rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink"
        >
          View Full Menu
        </Link>
      </motion.div>
    </motion.section>
  );
}
