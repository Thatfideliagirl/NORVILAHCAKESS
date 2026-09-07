"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { markInquiryViewed, markMessagesRead } from "@/lib/supabase/messages";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Stats = {
  totalOrders: number;
  pendingOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenue: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  status: string;
  total_naira: number;
  channel: string;
  created_at: string;
};

type UnreadMessage = {
  id: string;
  conversationId: string;
  body: string;
  created_at: string;
  customerName: string | null;
};

type NewInquiry = {
  id: string;
  name: string;
  occasion: string | null;
  created_at: string;
};

type RangePreset = "today" | "7d" | "30d" | "year" | "all";

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "This week" },
  { key: "30d", label: "This month" },
  { key: "year", label: "This year" },
  { key: "all", label: "All time" },
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function presetSince(preset: RangePreset): Date | null {
  const today = startOfToday();
  if (preset === "today") return today;
  if (preset === "7d") return new Date(today.getTime() - 6 * 86400000);
  if (preset === "30d") return new Date(today.getTime() - 29 * 86400000);
  if (preset === "year") return new Date(today.getFullYear(), 0, 1);
  return null;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

function dayOfMonth(date: Date): string {
  return String(date.getDate());
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<UnreadMessage[]>([]);
  const [newInquiries, setNewInquiries] = useState<NewInquiry[]>([]);
  const [signupCounts, setSignupCounts] = useState<{ label: string; dayNum: string; count: number }[]>(
    []
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [preset, setPreset] = useState<RangePreset>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(() => {
    if (customFrom) {
      const from = new Date(`${customFrom}T00:00:00`);
      const to = customTo ? new Date(`${customTo}T23:59:59`) : new Date();
      return { from, to };
    }
    return { from: presetSince(preset), to: new Date() };
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    let ordersQuery = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .lte("created_at", range.to.toISOString());
    let pendingQuery = supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("created_at", range.to.toISOString());
    let customersQuery = supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .lte("created_at", range.to.toISOString());
    let recentQuery = supabase
      .from("orders")
      .select("id, order_number, status, total_naira, channel, created_at")
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(8);
    let revenueQuery = supabase
      .from("orders")
      .select("total_naira")
      .not("status", "in", "(pending,cancelled)")
      .lte("created_at", range.to.toISOString());

    if (range.from) {
      const fromIso = range.from.toISOString();
      ordersQuery = ordersQuery.gte("created_at", fromIso);
      pendingQuery = pendingQuery.gte("created_at", fromIso);
      customersQuery = customersQuery.gte("created_at", fromIso);
      recentQuery = recentQuery.gte("created_at", fromIso);
      revenueQuery = revenueQuery.gte("created_at", fromIso);
    }

    Promise.all([
      ordersQuery,
      pendingQuery,
      customersQuery,
      supabase.from("products").select("id", { count: "exact", head: true }),
      recentQuery,
      revenueQuery,
    ]).then(([orders, pending, customers, products, recent, revenueRows]) => {
      const firstError = [
        orders.error,
        pending.error,
        customers.error,
        products.error,
        recent.error,
        revenueRows.error,
      ].find((e) => e);
      if (firstError) setLoadError(firstError.message);
      setStats({
        totalOrders: orders.count ?? 0,
        pendingOrders: pending.count ?? 0,
        totalCustomers: customers.count ?? 0,
        totalProducts: products.count ?? 0,
        revenue: (revenueRows.data ?? []).reduce((sum, row) => sum + row.total_naira, 0),
      });
      setRecentOrders(recent.data ?? []);
    });
  }, [range]);

  useEffect(() => {
    supabase
      .from("messages")
      .select("id, conversation_id, body, created_at, conversations(profiles(full_name))")
      .eq("sender_type", "customer")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<
        {
          id: string;
          conversation_id: string;
          body: string;
          created_at: string;
          conversations: { profiles: { full_name: string | null } | null } | null;
        }[]
      >()
      .then(({ data }) => {
        setUnreadMessages(
          (data ?? []).map((row) => ({
            id: row.id,
            conversationId: row.conversation_id,
            body: row.body,
            created_at: row.created_at,
            customerName: row.conversations?.profiles?.full_name ?? null,
          }))
        );
      });
    supabase
      .from("event_inquiries")
      .select("id, name, occasion, created_at")
      .eq("status", "new")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setNewInquiries(data ?? []));
  }, []);

  useEffect(() => {
    const since = new Date(startOfToday().getTime() - 13 * 86400000);
    supabase
      .from("profiles")
      .select("created_at")
      .eq("role", "customer")
      .gte("created_at", since.toISOString())
      .then(({ data }) => {
        const counts = new Map<string, number>();
        for (let i = 0; i < 14; i++) {
          const d = new Date(since.getTime() + i * 86400000);
          counts.set(dayKey(d), 0);
        }
        for (const row of data ?? []) {
          const key = dayKey(new Date(row.created_at));
          if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        setSignupCounts(
          Array.from(counts.entries()).map(([key, count]) => {
            const date = new Date(`${key}T00:00:00`);
            return { label: dayLabel(date), dayNum: dayOfMonth(date), count };
          })
        );
      });
  }, []);

  const cards = [
    { label: "Orders", value: stats?.totalOrders },
    { label: "Revenue", value: stats ? formatNaira(stats.revenue) : undefined },
    { label: "Pending orders", value: stats?.pendingOrders },
    { label: "New customers", value: stats?.totalCustomers },
    { label: "Products (all time)", value: stats?.totalProducts },
  ];

  const maxSignups = Math.max(1, ...signupCounts.map((d) => d.count));

  return (
    <div>
      <p className="font-display text-heading text-berry">Dashboard</p>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setPreset(p.key);
              setCustomFrom("");
              setCustomTo("");
            }}
            className={`rounded-pill px-4 py-1.5 font-body text-xs font-semibold ${
              preset === p.key && !customFrom
                ? "bg-berry text-cream"
                : "bg-plaster/40 text-ink/70"
            }`}
          >
            {p.label}
          </button>
        ))}
        <div className="flex w-full flex-wrap items-center gap-2 rounded-pill bg-plaster/25 px-3 py-1.5 sm:w-auto sm:flex-nowrap">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="min-w-[130px] flex-1 bg-transparent font-body text-xs text-ink sm:flex-none"
            aria-label="From date"
          />
          <span className="text-ink/40">–</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="min-w-[130px] flex-1 bg-transparent font-body text-xs text-ink sm:flex-none"
            aria-label="To date"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
        <div className="flex items-baseline justify-between">
          <p className="font-display text-product text-ink">Customers (Last 14 Days)</p>
          <p className="font-body text-small text-ink/50">
            {signupCounts.reduce((sum, d) => sum + d.count, 0)} total
          </p>
        </div>
        <div className="mt-4 flex h-48 items-end gap-2 rounded-panel bg-white p-5 pb-3 shadow-warm-lg">
          {signupCounts.map((d) => (
            <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
              {d.count > 0 && (
                <span className="font-body text-xs font-semibold text-berry">{d.count}</span>
              )}
              <div
                className={`w-full rounded-t-md ${d.count > 0 ? "bg-berry" : "bg-clay/15"}`}
                style={{ height: `${Math.max(6, (d.count / maxSignups) * 130)}px` }}
                title={`${d.label}: ${d.count} new customer${d.count === 1 ? "" : "s"}`}
              />
              <span className="border-t border-clay/20 pt-1 font-body text-[10px] text-ink/40">
                {d.dayNum}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div>
          <p className="font-display text-product text-ink">Unread inquiries &amp; messages</p>
          <div className="mt-4 flex flex-col gap-2 rounded-panel bg-white p-5 shadow-warm-lg">
            {newInquiries.length === 0 && unreadMessages.length === 0 && (
              <p className="py-4 text-center font-body text-small text-ink/50">All caught up.</p>
            )}
            {newInquiries.map((inquiry) => (
              <Link
                key={`inquiry-${inquiry.id}`}
                href="/admin/inquiries"
                onClick={() => {
                  markInquiryViewed(inquiry.id);
                  setNewInquiries((current) => current.filter((i) => i.id !== inquiry.id));
                }}
                className="flex items-center justify-between rounded-panel px-2 py-1.5 font-body text-small transition-colors hover:bg-plaster/30"
              >
                <span className="text-ink">
                  {inquiry.occasion ? `${inquiry.occasion} inquiry` : "New inquiry"} · {inquiry.name}
                </span>
                <span className="shrink-0 rounded-pill bg-berry/15 px-3 py-1 text-xs font-semibold text-berry">
                  New
                </span>
              </Link>
            ))}
            {unreadMessages.map((message) => (
              <Link
                key={`message-${message.id}`}
                href="/admin/messages"
                onClick={() => {
                  markMessagesRead(message.conversationId, "customer");
                  setUnreadMessages((current) => current.filter((m) => m.id !== message.id));
                }}
                className="flex items-center justify-between gap-3 rounded-panel px-2 py-1.5 font-body text-small transition-colors hover:bg-plaster/30"
              >
                <span className="min-w-0 flex-1 truncate text-ink">
                  {message.customerName ?? "Customer"}: {message.body}
                </span>
                <span className="shrink-0 rounded-pill bg-berry/15 px-3 py-1 text-xs font-semibold text-berry">
                  Unread
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <p className="font-display text-product text-ink">Orders in range</p>
          <Link href="/admin/orders" className="font-body text-small font-medium text-berry">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-panel bg-white shadow-warm-lg">
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
                    No orders in this range.
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
