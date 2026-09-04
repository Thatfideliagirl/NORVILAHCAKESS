"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Arch from "@/components/Arch";
import { OCCASIONS, buildWhatsAppEnquiryLink, type Occasion } from "@/lib/whatsapp";
import { revealContainer, revealUp } from "@/lib/motion";

export default function CelebrationsSection() {
  const [selected, setSelected] = useState<Occasion | null>(null);

  return (
    <motion.section
      id="celebrating"
      variants={revealContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="relative overflow-hidden bg-cocoa py-24 md:py-[200px]"
    >
      {/* Flour dust texture, so the dark section reads as a room, not a
          flat rectangle. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
        <filter id="flour-dust">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#flour-dust)" />
      </svg>

      <div className="relative mx-auto grid max-w-content gap-12 px-6 md:grid-cols-2 md:items-center md:gap-16">
        <motion.div variants={revealUp}>
          <h2 className="font-display text-heading text-plaster">
            What are we celebrating?
          </h2>
          <p className="measure mt-4 font-body text-lead text-plaster/80">
            Birthdays, parties, corporate events, or just a good reason to
            celebrate. Custom orders and event catering, made memorable.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {OCCASIONS.map((occasion) => {
              const isSelected = selected === occasion.id;
              return (
                <button
                  key={occasion.id}
                  type="button"
                  onClick={() =>
                    setSelected((current) =>
                      current === occasion.id ? null : occasion.id
                    )
                  }
                  aria-pressed={isSelected}
                  className={`rounded-pill border border-clay px-5 py-2.5 font-body text-small transition-colors duration-200 ${
                    isSelected
                      ? "bg-clay text-plaster"
                      : "text-plaster hover:bg-clay"
                  }`}
                >
                  {occasion.label}
                </button>
              );
            })}
          </div>

          <a
            href={buildWhatsAppEnquiryLink(selected)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-pill bg-plaster px-8 py-3.5 font-body font-medium text-cocoa transition-colors duration-200 hover:bg-cream"
          >
            Make an enquiry
          </a>
        </motion.div>

        <motion.div variants={revealUp} className="relative mx-auto hidden w-full max-w-sm md:block">
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-125 rounded-full bg-berry/30 blur-3xl"
          />
          <Arch
            src="/products/cakes.jpg"
            alt="A pink celebration cake topped with fresh strawberries and daisies."
            sizes="(min-width: 768px) 384px, 0px"
            className="relative"
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
