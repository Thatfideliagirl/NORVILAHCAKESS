"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { useScrollPast } from "@/lib/use-scroll-past";
import { revealContainer, revealUp } from "@/lib/motion";

export default function Hero() {
  const reducedMotion = usePrefersReducedMotion();
  const scrolled = useScrollPast(80);

  const containerVariants = reducedMotion
    ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
    : revealContainer;
  const itemVariants = reducedMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : revealUp;

  return (
    <section className="relative h-screen min-h-[620px] max-h-[900px] w-full overflow-hidden bg-cocoa">
      <div className="absolute inset-0">
        <Image
          src="/hero-still.jpg"
          alt="A pink celebration cake, a strawberry parfait, cupcakes, waffles and a meat pie arranged on a flour-dusted wooden table."
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Desktop: copy sits left, so the scrim darkens the wall from the
          left edge. Darkens the lit wall so the copy stays readable as
          the camera settles into the brighter final frame. */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(to right, rgba(58,36,31,0.55) 0%, rgba(58,36,31,0) 55%)",
        }}
      />
      <div
        className="absolute inset-y-0 left-0 hidden w-full max-w-2xl md:block"
        style={{
          background:
            "radial-gradient(60% 55% at 30% 55%, rgba(246,235,227,0.55) 0%, rgba(246,235,227,0) 100%)",
        }}
      />

      {/* Mobile: the food sits centre-right and the copy moves to the
          full-width lower half instead, so it needs a stronger scrim
          rising from the bottom rather than one from the left edge. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to top, rgba(58,36,31,0.8) 0%, rgba(58,36,31,0.35) 45%, rgba(58,36,31,0) 70%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/3 md:hidden"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 100%, rgba(246,235,227,0.5) 0%, rgba(246,235,227,0) 75%)",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex h-full max-w-content flex-col justify-end px-6 pb-20 md:justify-center md:px-0 md:pb-0 md:pl-[88px] md:w-[40%]"
      >
        {/* Brief specifies clay for this label; measured against the
            actual poster frame, clay never clears ~2.7:1 against the
            scrimmed wall at any point in its fade, so this uses ink,
            which reaches AA with the glow above. */}
        <motion.p
          variants={itemVariants}
          className="inline-block w-fit rounded-pill bg-cream/90 px-4 py-1.5 font-body text-small uppercase tracking-[0.12em] text-ink shadow-warm"
        >
          Freshly made, beautifully packaged
        </motion.p>
        <motion.h1
          variants={itemVariants}
          className="mt-4 font-display text-hero leading-[0.95] text-berry"
        >
          Norvilah Cakes
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="mt-4 font-display text-product text-ink"
        >
          More than treats. Moments of happiness.
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="measure mt-4 font-body text-lead text-ink"
        >
          From indulgent cakes and creamy parfaits to savoury bites, we make
          everything fresh for your special moments, and the random cravings
          too.
        </motion.p>
        <motion.div variants={itemVariants} className="mt-8">
          <Link
            href="/menu"
            className="inline-block rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink active:scale-[0.99]"
          >
            Shop Now
          </Link>
        </motion.div>
      </motion.div>

      <div
        className={`absolute bottom-6 left-6 z-10 flex items-center gap-2 text-cream transition-opacity duration-300 md:left-11 ${
          scrolled ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      >
        <span className="font-body text-small uppercase tracking-[0.12em] drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]">
          Scroll
        </span>
        <ChevronDown className="size-4 drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]" strokeWidth={1.5} />
      </div>
    </section>
  );
}
