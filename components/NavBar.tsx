"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShoppingBag, User } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav-links";
import { useCartCount, useCartHydration } from "@/store/cart";
import { useScrollPast } from "@/lib/use-scroll-past";
import MobileDrawer from "@/components/MobileDrawer";
import Logo from "@/components/Logo";

export default function NavBar() {
  const scrolled = useScrollPast(80);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cartCount = useCartCount();
  useCartHydration();

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 ${
          scrolled
            ? "bg-plaster shadow-warm"
            : "bg-transparent shadow-none"
        }`}
      >
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4 lg:px-11">
          <Link href="/">
            <Logo
              textClassName={`text-2xl transition-colors duration-300 ${
                scrolled ? "text-berry" : "text-cream drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]"
              }`}
            />
          </Link>

          <nav
            className={`hidden items-center gap-8 font-body text-small transition-colors duration-300 md:flex ${
              scrolled ? "text-ink" : "text-cream drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]"
            }`}
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-opacity hover:opacity-70"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/account"
              aria-label="Account"
              className={`hidden size-11 items-center justify-center transition-colors duration-300 md:flex ${
                scrolled ? "text-ink" : "text-cream drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]"
              }`}
            >
              <User className="size-5" strokeWidth={1.5} />
            </Link>

            <Link
              href="/cart"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
              className={`relative flex size-11 items-center justify-center transition-colors duration-300 ${
                scrolled ? "text-ink" : "text-cream drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]"
              }`}
            >
              <ShoppingBag className="size-5" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-berry text-[10px] font-semibold text-cream">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/menu"
              className="hidden rounded-pill bg-berry px-6 py-2.5 font-body text-small font-medium text-cream transition-colors duration-200 hover:bg-cocoa md:inline-block"
            >
              Order Now
            </Link>

            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
              className={`flex size-11 items-center justify-center transition-colors duration-300 md:hidden ${
                scrolled ? "text-ink" : "text-cream drop-shadow-[0_1px_6px_rgba(58,36,31,0.45)]"
              }`}
            >
              <Menu className="size-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
