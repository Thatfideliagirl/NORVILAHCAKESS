"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleQuestionMark, X } from "lucide-react";

const HELP_LINKS = [
  { label: "See the Menu", href: "/menu" },
  { label: "Plan an Event", href: "/#celebrating" },
  { label: "FAQs", href: "/#questions" },
  { label: "Contact Us", href: "/#contact" },
];

// A brand-styled, always-visible way to get oriented on the site,
// per the client's explicit request: a question-mark launcher (not a
// generic chat bubble or map icon) that offers the same four things
// a first-time visitor usually wants -- the menu, events, FAQs, and
// how to reach the business -- without needing a live agent.
export default function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-64 overflow-hidden rounded-panel bg-cream shadow-warm-lg"
          >
            <div className="bg-berry px-5 py-4">
              <p className="font-display text-product text-cream">
                Need a hand?
              </p>
              <p className="mt-1 font-body text-small text-cream/80">
                Here&apos;s where you probably want to go.
              </p>
            </div>
            <nav className="flex flex-col p-2">
              {HELP_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-panel px-4 py-3 font-body text-small font-medium text-ink transition-colors hover:bg-plaster/50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close help menu" : "Open help menu"}
        aria-expanded={open}
        className="flex size-14 items-center justify-center rounded-full bg-berry text-cream shadow-warm-lg transition-colors duration-200 hover:bg-cocoa"
      >
        {open ? (
          <X className="size-6" strokeWidth={1.75} />
        ) : (
          <MessageCircleQuestionMark className="size-6" strokeWidth={1.75} />
        )}
      </button>
    </div>
  );
}
