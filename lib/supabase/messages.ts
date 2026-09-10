"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

export type NotificationItem = {
  id: string;
  kind: "message" | "inquiry" | "order" | "broadcast";
  title: string;
  body: string;
  createdAt: string;
  href: string;
  markRead: () => Promise<void>;
};

type AnnouncementRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
};

// Same dismissal key AnnouncementPopup uses, so dismissing a broadcast
// from either the popup or the notification bell clears both -- there's
// no per-user "read" column for announcements, this localStorage flag
// is the only read-state that exists for them.
function announcementDismissedKey(id: string): string {
  return `norvilah-announcement-dismissed-${id}`;
}

type MessageRow = {
  id: string;
  conversation_id: string;
  body: string;
  created_at: string;
  conversations: { profiles: { full_name: string | null } | null } | null;
};

type InquiryRow = {
  id: string;
  name: string;
  occasion: string | null;
  created_at: string;
  viewed_at: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  total_naira: number;
  created_at: string;
};

// Notifications for the bell. RLS already scopes what each caller can
// see (a customer only ever sees their own conversation's rows, an
// admin sees all), so filtering by the *other* side's sender_type is
// enough for messages -- no need to also filter by conversation owner.
export function useNotifications(role: "customer" | "admin"): {
  items: NotificationItem[];
  count: number;
  refetch: () => void;
} {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const refetch = useCallback(() => {
    const messagesQuery = supabase
      .from("messages")
      .select("id, conversation_id, body, created_at, conversations(profiles(full_name))")
      .eq("sender_type", role === "customer" ? "admin" : "customer")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<MessageRow[]>();

    const inquiriesQuery =
      role === "admin"
        ? supabase
            .from("event_inquiries")
            .select("id, name, occasion, created_at, viewed_at")
            .is("viewed_at", null)
            .order("created_at", { ascending: false })
            .limit(5)
            .returns<InquiryRow[]>()
        : null;

    const ordersQuery =
      role === "admin"
        ? supabase
            .from("orders")
            .select("id, order_number, total_naira, created_at")
            .is("viewed_at", null)
            .order("created_at", { ascending: false })
            .limit(5)
            .returns<OrderRow[]>()
        : null;

    const now = new Date().toISOString();
    const announcementsQuery =
      role === "customer"
        ? supabase
            .from("announcements")
            .select("id, title, description, starts_at")
            .eq("active", true)
            .lte("starts_at", now)
            .or(`ends_at.is.null,ends_at.gte.${now}`)
            .order("starts_at", { ascending: false })
            .limit(5)
            .returns<AnnouncementRow[]>()
        : null;

    Promise.all([
      messagesQuery,
      inquiriesQuery ?? Promise.resolve({ data: [] as InquiryRow[] }),
      ordersQuery ?? Promise.resolve({ data: [] as OrderRow[] }),
      announcementsQuery ?? Promise.resolve({ data: [] as AnnouncementRow[] }),
    ]).then(([messagesRes, inquiriesRes, ordersRes, announcementsRes]) => {
      const messageItems: NotificationItem[] = (messagesRes.data ?? []).map((m) => ({
        id: `message-${m.id}`,
        kind: "message",
        title: role === "admin" ? m.conversations?.profiles?.full_name ?? "Customer" : "Norvilah",
        body: m.body,
        createdAt: m.created_at,
        href: "/admin/messages",
        markRead: () => markMessagesRead(m.conversation_id, role === "customer" ? "admin" : "customer"),
      }));
      const inquiryItems: NotificationItem[] = (inquiriesRes.data ?? []).map((i) => ({
        id: `inquiry-${i.id}`,
        kind: "inquiry",
        title: "New inquiry",
        body: `${i.occasion ? `${i.occasion} · ` : ""}${i.name}`,
        createdAt: i.created_at,
        href: "/admin/inquiries",
        markRead: () => markInquiryViewed(i.id),
      }));
      const orderItems: NotificationItem[] = (ordersRes.data ?? []).map((o) => ({
        id: `order-${o.id}`,
        kind: "order",
        title: "New order",
        body: `${o.order_number} · ${formatNaira(o.total_naira)}`,
        createdAt: o.created_at,
        href: "/admin/orders",
        markRead: () => markOrderViewed(o.id),
      }));
      const announcementItems: NotificationItem[] = (announcementsRes.data ?? [])
        .filter((a) => {
          try {
            return !localStorage.getItem(announcementDismissedKey(a.id));
          } catch {
            return true;
          }
        })
        .map((a) => ({
          id: `broadcast-${a.id}`,
          kind: "broadcast",
          title: "New broadcast",
          body: a.title + (a.description ? ` · ${a.description}` : ""),
          createdAt: a.starts_at,
          href: "/",
          markRead: () => dismissAnnouncement(a.id),
        }));
      setItems(
        [...messageItems, ...inquiryItems, ...orderItems, ...announcementItems].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        )
      );
    });
  }, [role]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, count: items.length, refetch };
}

export async function markMessagesRead(
  conversationId: string,
  fromSenderType: "customer" | "admin"
) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_type", fromSenderType)
    .is("read_at", null);
  if (error) console.error("markMessagesRead failed:", error.message);
}

export async function markInquiryViewed(inquiryId: string) {
  const { error } = await supabase
    .from("event_inquiries")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", inquiryId)
    .is("viewed_at", null);
  if (error) console.error("markInquiryViewed failed:", error.message);
}

export async function markOrderViewed(orderId: string) {
  const { error } = await supabase
    .from("orders")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", orderId)
    .is("viewed_at", null);
  if (error) console.error("markOrderViewed failed:", error.message);
}

export async function dismissAnnouncement(id: string) {
  try {
    localStorage.setItem(announcementDismissedKey(id), "1");
  } catch {
    // localStorage unavailable -- ignore
  }
}
