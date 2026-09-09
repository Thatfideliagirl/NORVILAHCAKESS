"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import OrderDetailModal from "@/components/OrderDetailModal";

const STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

type Order = {
  id: string;
  order_number: string;
  status: string;
  channel: string;
  payment_status: string;
  payment_method: string;
  total_naira: number;
  created_at: string;
  viewed_at: string | null;
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: { products: { image_url: string | null } | null }[];
};

function paymentMethodLabel(order: Pick<Order, "channel" | "payment_method">): string {
  if (order.channel === "whatsapp") return "WhatsApp";
  return order.payment_method === "card" ? "Website · Paystack" : "Website · Bank Transfer";
}

function fetchOrders() {
  return supabase
    .from("orders")
    .select(
      "id, order_number, status, channel, payment_status, payment_method, total_naira, created_at, viewed_at, profiles(full_name, phone), order_items(products(image_url))"
    )
    .order("created_at", { ascending: false })
    .returns<Order[]>();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchOrders().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setOrders(data ?? []);
    });
  }, []);

  async function updateStatus(order: Order, status: string) {
    setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, status } : o)));
    await supabase.from("orders").update({ status }).eq("id", order.id);
  }

  async function togglePaymentStatus(order: Order) {
    if (order.payment_status === "unpaid") return;
    const next = order.payment_status === "paid" ? "awaiting_confirmation" : "paid";
    setOrders((current) =>
      current.map((o) => (o.id === order.id ? { ...o, payment_status: next } : o))
    );
    await supabase.from("orders").update({ payment_status: next }).eq("id", order.id);
  }

  async function markViewed(order: Order) {
    if (order.viewed_at) return;
    const viewedAt = new Date().toISOString();
    setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, viewed_at: viewedAt } : o)));
    await supabase.from("orders").update({ viewed_at: viewedAt }).eq("id", order.id);
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} order${selected.size === 1 ? "" : "s"}? This can't be undone.`))
      return;
    setDeleting(true);
    const ids = Array.from(selected);
    await supabase.from("orders").delete().in("id", ids);
    setOrders((current) => current.filter((o) => !selected.has(o.id)));
    setSelected(new Set());
    setDeleting(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-display text-heading text-berry">Orders</p>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={deleteSelected}
            disabled={deleting}
            className="rounded-pill bg-berry px-5 py-2 font-body text-small font-medium text-cream disabled:opacity-60"
          >
            {deleting ? "Deleting..." : `Delete ${selected.size} selected`}
          </button>
        )}
      </div>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-white shadow-warm-lg">
        <table className="w-full min-w-[680px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="w-10 px-4 py-3"></th>
              <th className="hidden w-16 px-4 py-3 sm:table-cell"></th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Customer</th>
              <th className="px-4 py-3 font-medium">Order Via</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink/50">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const thumbnail = order.order_items.find((item) => item.products?.image_url)?.products
                ?.image_url;
              return (
              <tr
                key={order.id}
                className={`border-b border-clay/10 last:border-none ${!order.viewed_at ? "bg-berry/5" : ""}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggleSelected(order.id)}
                    aria-label={`Select order ${order.order_number}`}
                  />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-panel bg-plaster/40">
                    {thumbnail && <Image src={thumbnail} alt="" fill sizes="40px" className="object-cover" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink">
                  <div className="flex items-center gap-2">
                    {order.order_number}
                    {!order.viewed_at && (
                      <span className="rounded-pill bg-berry px-2 py-0.5 text-[10px] font-semibold text-cream">
                        New
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-ink/70 md:table-cell">
                  {order.profiles?.full_name ?? "-"}
                  {order.profiles?.phone ? ` · ${order.profiles.phone}` : ""}
                </td>
                <td className="px-4 py-3 text-ink/70">{paymentMethodLabel(order)}</td>
                <td className="px-4 py-3">
                  {order.payment_status === "unpaid" ? (
                    <span className="rounded-pill bg-berry px-3 py-1 text-xs font-semibold text-cream">
                      ⚠ Unpaid
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => togglePaymentStatus(order)}
                      title="Click to toggle between Awaiting Confirmation and Confirmed"
                      className={`rounded-pill px-4 py-1.5 text-xs font-semibold ${
                        order.payment_status === "paid"
                          ? "bg-berry/15 text-berry"
                          : "bg-clay/15 text-ink/60"
                      }`}
                    >
                      {order.payment_status === "paid" ? "Confirmed" : "Awaiting Confirmation"}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-berry">
                  {formatNaira(order.total_naira)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order, e.target.value)}
                    className="rounded-pill border border-clay/25 bg-cream px-3 py-1.5 text-xs capitalize"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      markViewed(order);
                      setDetailId(order.id);
                    }}
                    className="font-body text-small font-medium text-berry"
                  >
                    Details
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {detailId && (
        <OrderDetailModal orderId={detailId} showCustomer onClose={() => setDetailId(null)} />
      )}
    </div>
  );
}
