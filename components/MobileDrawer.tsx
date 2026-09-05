"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { User, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav-links";
import Logo from "@/components/Logo";

export default function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-cocoa/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="arch-bottom fixed inset-x-0 top-0 z-[80] bg-plaster pb-14 pt-8 shadow-warm-lg"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-6">
              <Logo textClassName="text-2xl text-berry" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="flex size-11 items-center justify-center text-ink"
              >
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="mt-8 flex flex-col items-center gap-6 font-display text-product text-ink">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} onClick={onClose}>
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/account"
                onClick={onClose}
                aria-label="Account"
                className="flex size-11 items-center justify-center text-ink"
              >
                <User className="size-5" strokeWidth={1.5} />
              </Link>
              <Link
                href="/menu"
                onClick={onClose}
                className="rounded-pill bg-berry px-8 py-3 font-body text-small font-medium text-cream"
              >
                Order Now
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
