"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export type NotificationItem = {
  id: string;
  kind: "message" | "inquiry";
  title: string;
  body: string;
  createdAt: string;
  href: string;
};

type MessageRow = {
  id: string;
  body: string;
  created_at: string;
  conversations: { profiles: { full_name: string | null } | null } | null;
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
      .select("id, body, created_at, conversations(profiles(full_name))")
      .eq("sender_type", role === "customer" ? "admin" : "customer")
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<MessageRow[]>();

    const inquiriesQuery =
      role === "admin"
        ? supabase
            .from("event_inquiries")
            .select("id, name, occasion, created_at")
            .eq("status", "new")
            .order("created_at", { ascending: false })
            .limit(5)
        : null;

    Promise.all([messagesQuery, inquiriesQuery ?? Promise.resolve({ data: [] })]).then(
      ([messagesRes, inquiriesRes]) => {
        const messageItems: NotificationItem[] = (messagesRes.data ?? []).map((m) => ({
          id: `message-${m.id}`,
          kind: "message",
          title: role === "admin" ? m.conversations?.profiles?.full_name ?? "Customer" : "Norvilah",
          body: m.body,
          createdAt: m.created_at,
          href: "/admin/messages",
        }));
        const inquiryItems: NotificationItem[] = (
          (inquiriesRes.data ?? []) as { id: string; name: string; occasion: string | null; created_at: string }[]
        ).map((i) => ({
          id: `inquiry-${i.id}`,
          kind: "inquiry",
          title: "New inquiry",
          body: `${i.occasion ? `${i.occasion} · ` : ""}${i.name}`,
          createdAt: i.created_at,
          href: "/admin/inquiries",
        }));
        setItems(
          [...messageItems, ...inquiryItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      }
    );
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
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_type", fromSenderType)
    .is("read_at", null);
}
