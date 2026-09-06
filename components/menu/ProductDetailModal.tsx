"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, ShoppingBag, X } from "lucide-react";
import type { Product } from "@/data/products";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/format";
import QuantityStepper from "@/components/menu/QuantityStepper";

// Keyed by product.id in the parent so a fresh mount (and fresh local
// state) happens whenever the shown product changes, instead of an
// effect syncing state after the fact.
function ProductDetailPanel({
  product,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onClose,
}: {
  product: Product;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const unitPrice = selectedVariant?.priceNaira ?? product.priceNaira;

  function handleAddToCart() {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      variantLabel: selectedVariant?.label,
      priceNaira: unitPrice,
      quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={(e) => e.stopPropagation()}
      className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-y-auto rounded-t-panel bg-cream md:flex-row md:rounded-panel"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-cream/90 text-ink shadow-warm"
      >
        <X className="size-5" strokeWidth={1.5} />
      </button>

      <div className="relative h-72 w-full shrink-0 bg-plaster/30 md:h-auto md:w-1/2">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-contain p-6 md:p-10"
        />
        {hasPrevious && (
          <button
            type="button"
            onClick={onPrevious}
            aria-label="Previous product"
            className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-ink shadow-warm"
          >
            <ChevronLeft className="size-5" strokeWidth={1.5} />
          </button>
        )}
        {hasNext && (
          <button
            type="button"
            onClick={onNext}
            aria-label="Next product"
            className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-cream/90 text-ink shadow-warm"
          >
            <ChevronRight className="size-5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="mb-4 flex items-center gap-2 self-start font-body text-small text-clay transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back to Menu
        </button>

        <h2 className="font-display text-heading leading-[1.05] text-berry">
          {product.name}
        </h2>
        <p className="mt-3 font-body text-lead text-ink/75">
          {product.description}
        </p>
        <p className="mt-4 font-body text-product font-semibold text-ink">
          {formatNaira(unitPrice)}
        </p>

        {product.variants && product.variants.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {product.variants.map((variant) => {
              const isSelected = variant.id === variantId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  aria-pressed={isSelected}
                  className={`rounded-pill border px-4 py-2 font-body text-small transition-colors duration-200 ${
                    isSelected
                      ? "border-berry bg-berry text-cream"
                      : "border-clay/40 text-ink hover:border-clay"
                  }`}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        )}

        {(product.benefits?.length || product.ingredients?.length) ? (
          <div className="mt-6 flex flex-col gap-3">
            {product.benefits && product.benefits.length > 0 && (
              <div className="rounded-panel bg-rose/40 p-4">
                <h3 className="font-body text-small font-semibold uppercase tracking-[0.08em] text-berry">
                  Good to Know
                </h3>
                <ul className="mt-2 flex flex-col gap-1 font-body text-small text-ink/80">
                  {product.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="rounded-panel bg-plaster/50 p-4">
                <h3 className="font-body text-small font-semibold uppercase tracking-[0.08em] text-clay">
                  Ingredients
                </h3>
                <p className="mt-2 font-body text-small text-ink/80">
                  {product.ingredients.join(", ")}
                </p>
              </div>
            )}
          </div>
        ) : null}

        <div className="mt-8 flex items-center gap-4">
          <QuantityStepper quantity={quantity} onChange={setQuantity} size="large" />
          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.95 }}
            animate={justAdded ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-berry px-6 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-cocoa"
          >
            <AnimatePresence mode="wait" initial={false}>
              {justAdded ? (
                <motion.span
                  key="added"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2"
                >
                  <Check className="size-4" strokeWidth={2} />
                  Added
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-2"
                >
                  <ShoppingBag className="size-4" strokeWidth={1.75} />
                  Add to Cart
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProductDetailModal({
  product,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onClose,
}: {
  product: Product | null;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!product) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrevious) onPrevious();
      if (e.key === "ArrowRight" && hasNext) onNext();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [product, hasPrevious, hasNext, onPrevious, onNext, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-cocoa/50 md:items-center md:p-6"
          onClick={onClose}
        >
          <ProductDetailPanel
            key={product.id}
            product={product}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            onPrevious={onPrevious}
            onNext={onNext}
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
