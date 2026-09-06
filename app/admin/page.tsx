"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  status: string;
  total_naira: number;
  channel: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    async function load() {
      const [orders, pending, customers, products, recent] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id, order_number, status, total_naira, channel, created_at")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);
      setStats({
        totalOrders: orders.count ?? 0,
        pendingOrders: pending.count ?? 0,
        totalCustomers: customers.count ?? 0,
        totalProducts: products.count ?? 0,
      });
      setRecentOrders(recent.data ?? []);
    }
    load();
  }, []);

  const cards = [
    { label: "Total orders", value: stats?.totalOrders },
    { label: "Pending orders", value: stats?.pendingOrders },
    { label: "Customers", value: stats?.totalCustomers },
    { label: "Products", value: stats?.totalProducts },
  ];

  return (
    <div>
      <p className="font-display text-heading text-berry">Dashboard</p>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-panel bg-plaster/25 p-5">
            <p className="font-body text-small text-ink/60">{card.label}</p>
            <p className="mt-2 font-display text-product text-ink">
              {card.value ?? "..."}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <p className="font-display text-product text-ink">Recent orders</p>
          <Link href="/admin/orders" className="font-body text-small font-medium text-berry">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-panel bg-cream shadow-warm">
          <table className="w-full min-w-[560px] text-left font-body text-small">
            <thead>
              <tr className="border-b border-clay/15 text-ink/50">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink/50">
                    No orders yet.
                  </td>
                </tr>
              )}
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-clay/10 last:border-none">
                  <td className="px-4 py-3 text-ink">{order.order_number}</td>
                  <td className="px-4 py-3 capitalize text-ink/70">{order.channel}</td>
                  <td className="px-4 py-3 capitalize text-ink/70">{order.status.replace("_", " ")}</td>
                  <td className="px-4 py-3 font-medium text-berry">{formatNaira(order.total_naira)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
