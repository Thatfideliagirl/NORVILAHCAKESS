"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { revealContainer, revealUp } from "@/lib/motion";

// Placeholder reviews, to be replaced with real ones (brief section 6).
const TESTIMONIALS = [
  {
    quote: "The parfaits are everything. So fresh and delicious.",
    name: "Teni A.",
  },
  {
    quote:
      "Ordered for my sister birthday and it was perfect. Beautiful and tastes amazing.",
    name: "Chioma K.",
  },
  {
    quote: "Best meat pies in Lagos. Everyone at my event loved it.",
    name: "Daniel O.",
  },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, TESTIMONIALS.length - 1));
    const card = track.children[clamped] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setActiveIndex(clamped);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / (track.clientWidth * 0.85));
    setActiveIndex(Math.max(0, Math.min(index, TESTIMONIALS.length - 1)));
  };

  return (
    <motion.section
      variants={revealContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="bg-cream py-24 md:py-40"
    >
      <motion.div variants={revealUp} className="mx-auto max-w-content px-6 text-center">
        <h2 className="font-display text-heading text-berry">Cravings approved</h2>
        <p className="mt-3 font-body text-lead text-ink/70">
          Do not just take our word for it.
        </p>
      </motion.div>

      <motion.div variants={revealUp} className="relative mx-auto mt-12 max-w-content">
        <button
          type="button"
          aria-label="Previous testimonial"
          onClick={() => scrollToIndex(activeIndex - 1)}
          className="absolute left-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-ink shadow-warm lg:-left-6 lg:flex"
        >
          <ChevronLeft className="size-5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Next testimonial"
          onClick={() => scrollToIndex(activeIndex + 1)}
          className="absolute right-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-ink shadow-warm lg:-right-6 lg:flex"
        >
          <ChevronRight className="size-5" strokeWidth={1.5} />
        </button>

        <div
          ref={trackRef}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:px-16 [&::-webkit-scrollbar]:hidden"
        >
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="flex w-[85%] shrink-0 snap-start gap-5 rounded-panel bg-plaster p-6 shadow-warm md:w-[420px]"
            >
              <span
                aria-hidden="true"
                className="flex size-16 shrink-0 items-center justify-center rounded-full bg-rose font-display text-product text-berry md:size-20"
              >
                {initials(testimonial.name)}
              </span>
              <div>
                <div className="flex gap-0.5 text-berry">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="size-3.5" fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <p className="mt-2 font-body text-body text-ink">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <p className="mt-3 font-display text-product text-berry">
                  {testimonial.name}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center gap-2 lg:hidden">
          {TESTIMONIALS.map((testimonial, i) => (
            <button
              key={testimonial.name}
              aria-label={`Go to testimonial ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className={`size-2 rounded-full transition-colors duration-200 ${
                i === activeIndex ? "bg-berry" : "bg-clay/30"
              }`}
            />
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
