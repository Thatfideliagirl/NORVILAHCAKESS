"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/data/products";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/format";
import { priceLabel } from "@/lib/menu";
import { useFavourites } from "@/lib/supabase/use-favourites";
import QuantityStepper from "@/components/menu/QuantityStepper";

export default function ProductRow({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: () => void;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const router = useRouter();
  const { isLoggedIn, isFavourite, toggle } = useFavourites();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  async function handleToggleFavourite(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/account");
      return;
    }
    toggle(product.slug);
  }

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
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen();
      }}
      className="flex cursor-pointer flex-col gap-4 border-b border-clay/15 py-6 first:pt-0 last:border-b-0 sm:flex-row sm:items-center"
    >
      <div className="relative size-24 shrink-0 overflow-hidden rounded-panel sm:size-28">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="112px"
          className="object-cover"
        />
        <button
          type="button"
          onClick={handleToggleFavourite}
          aria-label={isFavourite(product.slug) ? "Remove from favourites" : "Save to favourites"}
          className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-cream/80 text-berry backdrop-blur-sm"
        >
          <Heart className={`size-3.5 ${isFavourite(product.slug) ? "fill-current" : ""}`} strokeWidth={1.75} />
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-display text-product text-ink">{product.name}</h3>
        <p className="mt-1 line-clamp-2 font-body text-small text-ink/65">
          {product.description}
        </p>
        <p className="mt-2 font-body text-small font-semibold text-berry">
          {selectedVariant ? formatNaira(unitPrice) : priceLabel(product)}
        </p>
      </div>

      <div
        className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {product.variants && product.variants.length > 0 && (
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            className="rounded-pill border border-clay/40 bg-cream px-3 py-2 font-body text-small text-ink"
            aria-label={`${product.name} size`}
          >
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.label}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-3">
          <QuantityStepper quantity={quantity} onChange={setQuantity} />
          <motion.button
            type="button"
            onClick={handleAddToCart}
            whileTap={{ scale: 0.92 }}
            animate={justAdded ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex items-center gap-2 whitespace-nowrap rounded-pill bg-berry px-5 py-2.5 font-body text-small font-medium text-cream transition-colors duration-200 hover:bg-cocoa"
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
    </div>
  );
}
