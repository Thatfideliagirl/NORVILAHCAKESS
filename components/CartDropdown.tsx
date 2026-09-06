"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/format";
import { useStorefrontProducts } from "@/lib/supabase/storefront-products";
import QuantityStepper from "@/components/menu/QuantityStepper";

export default function CartDropdown({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const products = useStorefrontProducts();

  const total = items.reduce((sum, item) => sum + item.priceNaira * item.quantity, 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[95] bg-cocoa/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[96] flex w-full max-w-[420px] flex-col bg-cream shadow-warm-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Cart"
          >
            <div className="flex items-center justify-between border-b border-clay/15 px-6 py-5">
              <h2 className="font-display text-product text-berry">Your Cart</h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={onClose}
                className="flex size-9 items-center justify-center text-ink"
              >
                <X className="size-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              {items.length === 0 ? (
                <p className="py-16 text-center font-body text-body text-ink/50">
                  Your cart is empty.
                </p>
              ) : (
                <div className="divide-y divide-clay/10">
                  {items.map((item) => {
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={`${item.productId}-${item.variantId ?? "base"}`}
                        className="flex items-center gap-3 py-4"
                      >
                        {product && (
                          <div className="relative size-16 shrink-0 overflow-hidden rounded-panel">
                            <Image
                              src={product.image}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-body text-ink">{item.name}</h3>
                          {item.variantLabel && (
                            <p className="font-body text-small text-ink/55">{item.variantLabel}</p>
                          )}
                          <p className="mt-0.5 font-body text-small font-semibold text-berry">
                            {formatNaira(item.priceNaira)}
                          </p>
                        </div>
                        <QuantityStepper
                          quantity={item.quantity}
                          onChange={(quantity) => setQuantity(item.productId, quantity, item.variantId)}
                        />
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variantId)}
                          aria-label={`Remove ${item.name}`}
                          className="flex size-9 shrink-0 items-center justify-center text-clay transition-colors hover:text-berry"
                        >
                          <Trash2 className="size-4" strokeWidth={1.75} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-clay/15 px-6 py-5">
                <div className="flex items-center justify-between font-display text-product text-ink">
                  <span>Total</span>
                  <span className="text-berry">{formatNaira(total)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="mt-4 block rounded-pill bg-berry px-8 py-3.5 text-center font-body font-medium text-cream transition-colors duration-200 hover:bg-cocoa"
                >
                  Checkout
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
