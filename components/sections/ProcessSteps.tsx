"use client";

import { Search, ShoppingBag, Truck, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { revealContainer } from "@/lib/motion";

const iconPop = {
  hidden: { opacity: 0, scale: 0.4, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const },
  },
};

const STEPS = [
  {
    number: "1",
    icon: UserPlus,
    title: "Create an account.",
    body: "Sign up so we can save your orders and details.",
  },
  {
    number: "2",
    icon: Search,
    title: "Pick your treat.",
    body: "Browse the menu and choose your favourites.",
  },
  {
    number: "3",
    icon: ShoppingBag,
    title: "Place your order.",
    body: "Add to cart and complete your order.",
  },
  {
    number: "4",
    icon: Truck,
    title: "We prepare and deliver.",
    body: "Freshly made and brought to you.",
  },
];

export default function ProcessSteps() {
  return (
    <section className="bg-cream py-24 md:py-40">
      <div className="mx-auto max-w-content px-6 text-center">
        <h2 className="font-display text-heading text-berry">
          From craving to your door
        </h2>
        <p className="mt-3 font-body text-lead font-medium text-ink/80">
          Simple. Quick. Delicious.
        </p>
      </div>

      <motion.div
        variants={revealContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto mt-16 max-w-content px-6"
      >
        <div className="relative flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-6">
          <div
            aria-hidden="true"
            className="absolute left-6 top-0 bottom-0 w-px bg-clay/40 md:left-0 md:right-0 md:top-6 md:h-px md:w-auto md:bottom-auto"
          />
          {STEPS.map(({ number, icon: Icon, title, body }) => (
            <div
              key={number}
              className="relative flex gap-5 pl-0 md:flex-1 md:flex-col md:items-center md:gap-4 md:text-center"
            >
              <motion.span
                variants={iconPop}
                className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-plaster"
              >
                <Icon className="size-6 text-berry" strokeWidth={1.5} />
              </motion.span>
              <div className="md:mt-2">
                <span className="font-display text-product text-berry">
                  {number}
                </span>
                <h3 className="mt-1 font-display text-product font-semibold text-ink">
                  {title}
                </h3>
                <p className="mt-2 max-w-[28ch] font-body text-lead font-medium text-ink/85 md:mx-auto">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
