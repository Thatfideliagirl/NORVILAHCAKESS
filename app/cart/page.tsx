"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { products } from "@/data/products";
import QuantityStepper from "@/components/menu/QuantityStepper";

function buildOrderMessage(
  items: ReturnType<typeof useCartStore.getState>["items"],
  total: number
): string {
  const lines = ["Hi Norvilah, I would like to place an order:", ""];
  for (const item of items) {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : "";
    lines.push(`${item.quantity} x ${item.name}${variant} — ${formatNaira(item.priceNaira * item.quantity)}`);
  }
  lines.push("", `Total: ${formatNaira(total)}`);
  return lines.join("\n");
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const total = items.reduce((sum, item) => sum + item.priceNaira * item.quantity, 0);

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6 pt-24 text-center">
        <p className="font-display text-heading text-berry">
          Your cart is empty.
        </p>
        <Link
          href="/menu"
          className="rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink"
        >
          Browse the Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 pb-24 pt-32 lg:px-11">
      <div className="mx-auto max-w-content">
        <h1 className="font-display text-heading text-berry">Your Cart</h1>

        <div className="mt-10 divide-y divide-clay/15">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return (
              <div
                key={`${item.productId}-${item.variantId ?? "base"}`}
                className="flex items-center gap-4 py-6"
              >
                {product && (
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-panel">
                    <Image
                      src={product.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-product text-ink">{item.name}</h3>
                  {item.variantLabel && (
                    <p className="font-body text-small text-ink/60">{item.variantLabel}</p>
                  )}
                  <p className="mt-1 font-body text-small font-semibold text-berry">
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
                  className="flex size-10 shrink-0 items-center justify-center text-clay transition-colors hover:text-berry"
                >
                  <Trash2 className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-end gap-6 border-t border-clay/15 pt-8">
          <p className="font-display text-product text-ink">
            Total: <span className="text-berry">{formatNaira(total)}</span>
          </p>
          <a
            href={buildWhatsAppLink(buildOrderMessage(items, total))}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-pill bg-berry px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-cocoa"
          >
            Order via WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
