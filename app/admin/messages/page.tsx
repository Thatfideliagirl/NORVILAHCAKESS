"use client";

import { Fragment, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/supabase/use-admin-session";
import { markMessagesRead } from "@/lib/supabase/messages";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Conversation = {
  id: string;
  updated_at: string;
  profiles: { full_name: string | null; email: string | null } | null;
};

type Message = {
  id: string;
  sender_type: "customer" | "admin";
  body: string;
  created_at: string;
};

function fetchConversations() {
  return supabase
    .from("conversations")
    .select("id, updated_at, profiles(full_name, email)")
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();
}

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={null}>
      <AdminMessagesContent />
    </Suspense>
  );
}

function AdminMessagesContent() {
  const { session } = useAdminSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(searchParams.get("open"));

  useEffect(() => {
    fetchConversations().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setConversations(data ?? []);
    });
  }, []);

  return (
    <div>
      <p className="font-display text-heading text-berry">Messages</p>
      <p className="mt-2 font-body text-body text-ink/60">
        Chats customers have started from their account.
      </p>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-3">
        {conversations.length === 0 && (
          <p className="rounded-panel bg-cream p-6 text-center font-body text-body text-ink/50 shadow-warm">
            No conversations yet.
          </p>
        )}
        {conversations.map((conversation) => (
          <Fragment key={conversation.id}>
            <div className="flex items-center justify-between rounded-panel bg-cream p-5 shadow-warm">
              <div>
                <p className="font-display text-product text-ink">
                  {conversation.profiles?.full_name ?? "Customer"}
                </p>
                <p className="mt-1 font-body text-small text-ink/60">{conversation.profiles?.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenId(openId === conversation.id ? null : conversation.id)}
                  className="font-body text-small font-medium text-berry"
                >
                  {openId === conversation.id ? "Close" : "Open"}
                </button>
              </div>
            </div>
            {openId === conversation.id && session && (
              <ConversationThread conversationId={conversation.id} adminId={session.user.id} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function ConversationThread({ conversationId, adminId }: { conversationId: string; adminId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  function fetchMessages() {
    return supabase
      .from("messages")
      .select("id, sender_type, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .returns<Message[]>();
  }

  useEffect(() => {
    fetchMessages().then(({ data }) => setMessages(data ?? []));
    markMessagesRead(conversationId, "customer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Live-update the chat: without this, a customer's reply only shows up
  // after the admin refreshes or reopens the conversation.
  useEffect(() => {
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          setMessages((current) =>
            current.some((m) => m.id === message.id) ? current : [...current, message]
          );
          if (message.sender_type === "customer") markMessagesRead(conversationId, "customer");
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const { data: message } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "admin",
        sender_id: adminId,
        body: text.trim(),
      })
      .select("id, sender_type, body, created_at")
      .single();
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (message) setMessages((current) => [...current, message]);
    setText("");
    setSending(false);
  }

  return (
    <div className="rounded-panel bg-plaster/20 p-5">
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="font-body text-small text-ink/50">No messages yet.</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[75%] rounded-panel px-4 py-2.5 font-body text-small ${
              message.sender_type === "admin"
                ? "self-end bg-berry text-cream"
                : "self-start bg-cream text-ink shadow-warm"
            }`}
          >
            {message.body}
          </div>
        ))}
      </div>
      <form onSubmit={sendReply} className="mt-4 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply to this customer..."
          className="flex-1 rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-small text-ink"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
