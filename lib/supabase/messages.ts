"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Notification-bell unread count. RLS already scopes what each caller
// can see (a customer only ever sees their own conversation's rows, an
// admin sees all), so filtering by the *other* side's sender_type here
// is enough -- no need to also filter by conversation ownership.
export function useUnreadMessageCount(role: "customer" | "admin"): {
  count: number;
  refetch: () => void;
} {
  const [count, setCount] = useState(0);

  const refetch = useCallback(() => {
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_type", role === "customer" ? "admin" : "customer")
      .is("read_at", null)
      .then(({ count }) => setCount(count ?? 0));
  }, [role]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { count, refetch };
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
