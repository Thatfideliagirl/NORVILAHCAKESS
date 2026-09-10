"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

type OrderItem = {
  product_name: string;
  variant_label: string | null;
  unit_price_naira: number;
  quantity: number;
  line_total_naira: number;
  products: { image_url: string | null } | null;
};

type OrderDetail = {
  id: string;
  order_number: string;
  status: string;
  channel: string;
  payment_status: string;
  payment_method: string;
  customer_name: string | null;
  delivery_address: string | null;
  notes: string | null;
  subtotal_naira: number;
  delivery_fee_naira: number;
  total_naira: number;
  receipt_url: string | null;
  created_at: string;
  delivery_locations: { name: string } | null;
  order_items: OrderItem[];
  profiles: { full_name: string | null; phone: string | null } | null;
};

export default function OrderDetailModal({
  orderId,
  showCustomer = false,
  onClose,
}: {
  orderId: string;
  showCustomer?: boolean;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("orders")
      .select(
        "id, order_number, status, channel, payment_status, payment_method, customer_name, delivery_address, notes, subtotal_naira, delivery_fee_naira, total_naira, receipt_url, created_at, delivery_locations(name), order_items(product_name, variant_label, unit_price_naira, quantity, line_total_naira, products(image_url)), profiles(full_name, phone)"
      )
      .eq("id", orderId)
      .single<OrderDetail>()
      .then(({ data }) => {
        setOrder(data);
        if (data?.receipt_url) {
          supabase.storage
            .from("receipts")
            .createSignedUrl(data.receipt_url, 600)
            .then(({ data: signed }) => setReceiptUrl(signed?.signedUrl ?? null));
        }
      });
  }, [orderId]);

  async function togglePaymentStatus() {
    if (!order || order.payment_status === "unpaid") return;
    const next = order.payment_status === "paid" ? "awaiting_confirmation" : "paid";
    setOrder({ ...order, payment_status: next });
    await supabase.from("orders").update({ payment_status: next }).eq("id", order.id);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-cocoa/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/2 z-[110] mx-auto max-h-[85vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-panel bg-cream p-6 shadow-warm-lg"
      >
        <div className="flex items-start justify-between">
          <p className="font-display text-product text-berry">
            {order ? order.order_number : "Order"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-plaster/40 text-ink"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {!order ? (
          <p className="mt-6 font-body text-body text-ink/60">Loading...</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4 font-body text-small text-ink">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-plaster/40 px-3 py-1 text-xs font-semibold capitalize text-ink/70">
                {order.status.replace("_", " ")}
              </span>
              <span className="rounded-pill bg-plaster/40 px-3 py-1 text-xs font-semibold text-ink/70">
                {order.channel === "whatsapp"
                  ? "WhatsApp"
                  : order.payment_method === "card"
                    ? "Website · Paystack"
                    : "Website · Bank Transfer"}
              </span>
              {showCustomer &&
                (order.payment_status === "unpaid" ? (
                  <span className="rounded-pill bg-berry px-3 py-1 text-xs font-semibold text-cream">
                    ⚠ Payment not made
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={togglePaymentStatus}
                    title="Click to toggle between Awaiting Confirmation and Confirmed"
                    className={`rounded-pill px-3 py-1 text-xs font-semibold ${
                      order.payment_status === "paid" ? "bg-berry/15 text-berry" : "bg-plaster/40 text-ink/60"
                    }`}
                  >
                    {order.payment_status === "paid" ? "Confirmed" : "Awaiting Confirmation"}
                  </button>
                ))}
            </div>

            {showCustomer && (
              <p className="text-ink/70">
                {order.profiles?.full_name ?? "-"}
                {order.profiles?.phone ? ` · ${order.profiles.phone}` : ""}
              </p>
            )}

            <div className="rounded-panel bg-plaster/20 p-4">
              {order.customer_name && (
                <p>
                  <span className="text-ink/50">Name: </span>
                  {order.customer_name}
                </p>
              )}
              {order.delivery_locations?.name && (
                <p className="mt-1">
                  <span className="text-ink/50">Delivery zone: </span>
                  {order.delivery_locations.name}
                </p>
              )}
              {order.delivery_address && (
                <p className="mt-1">
                  <span className="text-ink/50">Address: </span>
                  {order.delivery_address}
                </p>
              )}
              {order.notes && (
                <p className="mt-1">
                  <span className="text-ink/50">Additional info: </span>
                  {order.notes}
                </p>
              )}
            </div>

            <div className="flex flex-col divide-y divide-clay/15">
              {order.order_items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-panel bg-plaster/40">
                    {item.products?.image_url && (
                      <Image src={item.products.image_url} alt="" fill sizes="48px" className="object-cover" />
                    )}
                  </div>
                  <span className="flex-1">
                    {item.quantity} x {item.product_name}
                    {item.variant_label ? ` (${item.variant_label})` : ""}
                  </span>
                  <span className="font-medium text-berry">{formatNaira(item.line_total_naira)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1 border-t border-clay/15 pt-3">
              <div className="flex justify-between text-ink/70">
                <span>Subtotal</span>
                <span>{formatNaira(order.subtotal_naira)}</span>
              </div>
              <div className="flex justify-between text-ink/70">
                <span>Delivery</span>
                <span>{formatNaira(order.delivery_fee_naira)}</span>
              </div>
              <div className="flex justify-between font-display text-body text-ink">
                <span>Total</span>
                <span className="text-berry">{formatNaira(order.total_naira)}</span>
              </div>
            </div>

            {order.payment_method === "bank_transfer" && (
              <div>
                <p className="font-body text-small font-medium text-ink/70">Payment receipt</p>
                {receiptUrl ? (
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                    <div className="relative h-48 w-full overflow-hidden rounded-panel bg-plaster/20">
                      <Image src={receiptUrl} alt="Payment receipt" fill className="object-contain" />
                    </div>
                  </a>
                ) : (
                  <p className="mt-1 text-ink/50">No receipt uploaded.</p>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
