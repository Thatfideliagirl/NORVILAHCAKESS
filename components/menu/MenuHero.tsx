"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { revealContainer, revealUp } from "@/lib/motion";

// Same visual language as the homepage hero: the photo is a full-bleed
// background with a scrim, not a boxed image beside the copy, and the
// heading sits to one side rather than centred. Kept far shorter than
// the homepage hero since this is a page banner, not a full scene.
export default function MenuHero() {
  const reducedMotion = usePrefersReducedMotion();

  const containerVariants = reducedMotion
    ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
    : revealContainer;
  const itemVariants = reducedMotion
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } }
    : revealUp;

  return (
    <section className="relative h-[52vh] min-h-[360px] max-h-[520px] w-full overflow-hidden bg-cocoa">
      <div className="absolute inset-0">
        <Image
          src="/hero-still.jpg"
          alt="A parfait, cupcake and waffles arranged on a flour-dusted wooden table."
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(58,36,31,0.6) 0%, rgba(58,36,31,0.15) 55%, rgba(58,36,31,0) 75%)",
        }}
      />
      <div
        className="absolute inset-y-0 left-0 w-full max-w-md"
        style={{
          background:
            "radial-gradient(60% 65% at 25% 55%, rgba(246,235,227,0.5) 0%, rgba(246,235,227,0) 100%)",
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex h-full max-w-content flex-col justify-center px-6 md:px-0 md:pl-11"
      >
        <motion.p
          variants={itemVariants}
          className="inline-block w-fit rounded-pill bg-cream/90 px-4 py-1.5 font-body text-small uppercase tracking-[0.12em] text-ink shadow-warm"
        >
          Our Menu
        </motion.p>
        <motion.h1
          variants={itemVariants}
          className="mt-4 font-display text-heading leading-[1.05] text-berry"
        >
          Freshly Made
          <br />
          Just for You.
        </motion.h1>
        <motion.span
          variants={itemVariants}
          aria-hidden="true"
          className="mt-6 block h-[3px] w-16 bg-berry"
        />
      </motion.div>
    </section>
  );
}
