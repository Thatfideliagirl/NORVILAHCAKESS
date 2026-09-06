"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

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
  total_naira: number;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
};

function fetchOrders() {
  return supabase
    .from("orders")
    .select(
      "id, order_number, status, channel, payment_status, total_naira, created_at, profiles(full_name, phone)"
    )
    .order("created_at", { ascending: false })
    .returns<Order[]>();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders().then(({ data }) => setOrders(data ?? []));
  }, []);

  async function updateStatus(order: Order, status: string) {
    setOrders((current) => current.map((o) => (o.id === order.id ? { ...o, status } : o)));
    await supabase.from("orders").update({ status }).eq("id", order.id);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Orders</p>

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[720px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Channel</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/50">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-clay/10 last:border-none">
                <td className="px-4 py-3 text-ink">{order.order_number}</td>
                <td className="px-4 py-3 text-ink/70">
                  {order.profiles?.full_name ?? "-"}
                  {order.profiles?.phone ? ` · ${order.profiles.phone}` : ""}
                </td>
                <td className="px-4 py-3 capitalize text-ink/70">{order.channel}</td>
                <td className="px-4 py-3 capitalize text-ink/70">
                  {order.payment_status.replace("_", " ")}
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
