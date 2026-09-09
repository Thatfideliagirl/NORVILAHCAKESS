"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { Heart, LogOut, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { OCCASIONS, type Occasion } from "@/lib/whatsapp";
import { markMessagesRead } from "@/lib/supabase/messages";
import { sendInquiryAlert } from "@/lib/emailjs";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/NotificationBell";
import ProfileSection from "@/components/account/ProfileSection";
import OrderDetailModal from "@/components/OrderDetailModal";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  about: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_naira: number;
  created_at: string;
  order_items: { id: string; products: { image_url: string | null } | null }[];
};

const PAST_STATUSES = ["delivered", "cancelled"];

type Inquiry = {
  id: string;
  occasion: string | null;
  event_date: string | null;
  status: string;
  created_at: string;
};

const OPEN_INQUIRY_STATUSES = ["new", "contacted", "in_progress"];

type Favourite = {
  id: string;
  product_slug: string;
};

type Conversation = {
  id: string;
  status: string;
  updated_at: string;
};

type Message = {
  id: string;
  sender_type: "customer" | "admin";
  body: string;
  created_at: string;
};

const TABS = ["Overview", "My Orders", "My Inquiries", "Messages", "Favourites", "Profile Settings"] as const;
type Tab = (typeof TABS)[number];

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink";

export default function SignedInAccount({ session }: { session: Session }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const messagesLoaded = useRef(false);

  function fetchProfile() {
    return supabase
      .from("profiles")
      .select("full_name, email, phone, location, about, role, avatar_url, created_at")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user.id]);

  function fetchOrders() {
    return supabase
      .from("orders")
      .select("id, order_number, status, total_naira, created_at, order_items(id, products(image_url))")
      .eq("customer_id", session.user.id)
      .order("created_at", { ascending: false })
      .returns<Order[]>()
      .then(({ data }) => setOrders(data ?? []));
  }

  function fetchInquiries() {
    return supabase
      .from("event_inquiries")
      .select("id, occasion, event_date, status, created_at")
      .eq("customer_id", session.user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setInquiries(data ?? []));
  }

  function fetchFavourites() {
    return supabase
      .from("favourites")
      .select("id, product_slug")
      .eq("customer_id", session.user.id)
      .then(({ data }) => setFavourites(data ?? []));
  }

  useEffect(() => {
    fetchOrders();
    fetchInquiries();
    fetchFavourites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.user.id]);

  useEffect(() => {
    if (tab !== "Messages" || messagesLoaded.current) return;
    messagesLoaded.current = true;
    supabase
      .from("conversations")
      .select("id, status, updated_at")
      .eq("customer_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data: convo }) => {
        setConversation(convo);
        if (!convo) return;
        supabase
          .from("messages")
          .select("id, sender_type, body, created_at")
          .eq("conversation_id", convo.id)
          .order("created_at", { ascending: true })
          .then(({ data }) => setMessages(data ?? []));
        markMessagesRead(convo.id, "admin");
      });
  }, [tab, session.user.id]);

  // Live-update the chat: without this, a reply from admin only shows up
  // after the customer refreshes or reopens the tab.
  useEffect(() => {
    if (!conversation) return;
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const message = payload.new as Message;
          setMessages((current) =>
            current.some((m) => m.id === message.id) ? current : [...current, message]
          );
          if (message.sender_type === "admin") markMessagesRead(conversation.id, "admin");
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation]);

  const activeOrders = orders.filter((o) => !PAST_STATUSES.includes(o.status)).length;
  const pastOrders = orders.filter((o) => PAST_STATUSES.includes(o.status)).length;
  const inquiriesInProgress = inquiries.filter((i) => OPEN_INQUIRY_STATUSES.includes(i.status)).length;

  const navItems = (
    <nav className="flex flex-col gap-1">
      {TABS.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => {
            setTab(t);
            setDrawerOpen(false);
          }}
          className={`rounded-panel px-3 py-2 text-left font-body text-small font-medium transition-colors ${
            tab === t ? "bg-berry text-cream" : "text-ink/80 hover:bg-plaster/60"
          }`}
        >
          {t}
        </button>
      ))}
      <Link
        href="/menu"
        onClick={() => setDrawerOpen(false)}
        className="rounded-panel px-3 py-2 font-body text-small font-medium text-ink/80 transition-colors hover:bg-plaster/60"
      >
        Menu
      </Link>
    </nav>
  );

  return (
    <main className="min-h-screen bg-cream pt-16">
      <div className="fixed inset-x-0 top-16 z-30 flex items-center justify-between border-b border-clay/15 bg-plaster/20 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          className="flex size-9 items-center justify-center text-ink"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-2">
          <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={32} />
          <p className="font-body text-small font-semibold text-ink">
            {profile?.full_name?.split(" ")[0] || "Account"}
          </p>
        </div>
        <NotificationBell role="customer" onSelectMessage={() => setTab("Messages")} align="right" />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-cocoa/40 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-plaster/95 px-4 py-6 shadow-warm-lg md:hidden"
            >
              <div className="mb-6 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-3">
                  <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={40} />
                  <p className="font-body text-small font-semibold text-ink">
                    {profile?.full_name || "Account"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex size-9 items-center justify-center text-ink"
                >
                  <X className="size-5" strokeWidth={1.75} />
                </button>
              </div>
              {navItems}
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="mt-8 flex w-full items-center gap-2 rounded-panel px-3 py-2 font-body text-small font-medium text-ink/70 transition-colors hover:bg-plaster/60"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
                Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex">
        <aside className="hidden w-60 shrink-0 border-r border-clay/15 bg-plaster/20 px-4 py-8 md:block">
          <div className="mb-6 flex items-center gap-3 px-1">
            <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={40} />
            <div className="min-w-0">
              <p className="truncate font-body text-small font-semibold text-ink">
                {profile?.full_name || "Account"}
              </p>
              <p className="truncate font-body text-xs text-ink/50">{profile?.email}</p>
            </div>
          </div>
          {navItems}
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-8 flex w-full items-center gap-2 rounded-panel px-3 py-2 font-body text-small font-medium text-ink/70 transition-colors hover:bg-plaster/60"
          >
            <LogOut className="size-4" strokeWidth={1.75} />
            Sign out
          </button>
        </aside>

        <div className="flex-1 px-6 pb-24 pt-20 md:px-10 md:py-10">
          <div className="flex items-center justify-between gap-4">
            <p className="font-display text-heading text-berry">
              Welcome, {profile?.full_name?.split(" ")[0] || "there"}{" "}
              <span aria-hidden="true">👋</span>
            </p>
            <div className="hidden items-center gap-3 md:flex">
              <NotificationBell role="customer" onSelectMessage={() => setTab("Messages")} />
              <button
                type="button"
                onClick={() => setTab("Messages")}
                className="rounded-pill bg-berry px-5 py-2.5 font-body text-small font-medium text-cream"
              >
                Need help? Chat with us
              </button>
            </div>
          </div>

          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="mt-4 inline-block rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream transition-colors duration-200 hover:bg-ink"
            >
              Go to Admin Dashboard
            </Link>
          )}

          <div className="mt-8">
            {tab === "Overview" && (
              <div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-panel bg-plaster/25 p-5">
                    <p className="font-body text-small text-ink/60">Active orders</p>
                    <p className="mt-2 font-display text-product text-ink">{activeOrders}</p>
                  </div>
                  <div className="rounded-panel bg-plaster/25 p-5">
                    <p className="font-body text-small text-ink/60">Inquiry in progress</p>
                    <p className="mt-2 font-display text-product text-ink">{inquiriesInProgress}</p>
                  </div>
                  <div className="rounded-panel bg-plaster/25 p-5">
                    <p className="font-body text-small text-ink/60">Past orders</p>
                    <p className="mt-2 font-display text-product text-ink">{pastOrders}</p>
                  </div>
                  <div className="rounded-panel bg-plaster/25 p-5">
                    <p className="font-body text-small text-ink/60">Saved items</p>
                    <p className="mt-2 font-display text-product text-ink">{favourites.length}</p>
                  </div>
                </div>

                {orders.length > 0 && (
                  <div className="mt-8">
                    <p className="font-display text-product text-ink">Recent orders</p>
                    <div className="mt-3 flex flex-col gap-3">
                      {orders.slice(0, 3).map((order) => (
                        <OrderCard key={order.id} order={order} onViewDetails={() => setDetailOrderId(order.id)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "My Orders" && (
              <div className="flex flex-col gap-3">
                {orders.length === 0 && <EmptyState text="No orders yet." />}
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} onViewDetails={() => setDetailOrderId(order.id)} />
                ))}
              </div>
            )}

            {tab === "My Inquiries" && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-display text-product text-ink">Your inquiries</p>
                  <button
                    type="button"
                    onClick={() => setInquiryFormOpen((current) => !current)}
                    className="rounded-pill bg-cocoa px-5 py-2 font-body text-small font-medium text-cream"
                  >
                    {inquiryFormOpen ? "Close" : "Make an inquiry"}
                  </button>
                </div>

                {inquiryFormOpen && (
                  <div className="mt-4 rounded-panel bg-plaster/25 p-5">
                    <InquiryForm
                      session={session}
                      profile={profile}
                      onSaved={() => {
                        setInquiryFormOpen(false);
                        fetchInquiries();
                      }}
                    />
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3">
                  {inquiries.length === 0 && <EmptyState text="No event inquiries yet." />}
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="flex items-center justify-between rounded-panel bg-plaster/25 p-5">
                      <p className="font-body text-body text-ink">
                        {inquiry.occasion ?? "Event inquiry"}
                        {inquiry.event_date ? ` · ${inquiry.event_date}` : ""}
                      </p>
                      <span className="rounded-pill bg-berry/15 px-4 py-1.5 text-xs font-semibold capitalize text-berry">
                        {inquiry.status.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "Messages" && (
              <MessagesPanel
                session={session}
                conversation={conversation}
                messages={messages}
                onConversationStarted={(convo) => setConversation(convo)}
                onMessageSent={(message) => setMessages((current) => [...current, message])}
              />
            )}

            {tab === "Favourites" && (
              <FavouritesPanel favourites={favourites} onChanged={fetchFavourites} />
            )}

            {tab === "Profile Settings" && profile && (
              <ProfileSection userId={session.user.id} profile={profile} onSaved={setProfile} />
            )}
          </div>
        </div>
      </div>

      {detailOrderId && (
        <OrderDetailModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} />
      )}
    </main>
  );
}

function OrderCard({ order, onViewDetails }: { order: Order; onViewDetails: () => void }) {
  const thumbnail = order.order_items.find((item) => item.products?.image_url)?.products?.image_url;
  return (
    <div className="flex items-center justify-between gap-4 rounded-panel bg-plaster/25 p-5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-panel bg-plaster/40">
        {thumbnail && <Image src={thumbnail} alt="" fill sizes="56px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-body text-ink">{order.order_number}</p>
        <p className="mt-1 font-body text-small text-ink/60">
          {new Date(order.created_at).toLocaleDateString()} · {order.order_items.length} item
          {order.order_items.length === 1 ? "" : "s"}
        </p>
        <span className="mt-1 inline-block rounded-pill bg-berry/15 px-3 py-1 text-xs font-semibold capitalize text-berry">
          {order.status.replace("_", " ")}
        </span>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p className="font-body text-small font-semibold text-berry">{formatNaira(order.total_naira)}</p>
        <button type="button" onClick={onViewDetails} className="font-body text-small font-medium text-berry">
          View Details
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-panel bg-plaster/25 p-6 text-center font-body text-body text-ink/50">
      {text}
    </p>
  );
}

function InquiryForm({
  session,
  profile,
  onSaved,
}: {
  session: Session;
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [occasion, setOccasion] = useState<Occasion | "">("");
  const [eventDate, setEventDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Please add your name and phone number.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from("event_inquiries").insert({
      customer_id: session.user.id,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      occasion: occasion || null,
      event_date: eventDate || null,
      message: message.trim() || null,
    });
    setSaving(false);
    if (insertError) {
      setError("Could not send your inquiry. Please try again.");
      return;
    }
    sendInquiryAlert({
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      event_date: eventDate || "Not specified",
      inquiry_message: message.trim() || "No message provided.",
    });
    onSaved();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className={inputClasses}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          className={inputClasses}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email (optional)"
          className={inputClasses}
        />
        <select
          value={occasion}
          onChange={(e) => setOccasion(e.target.value as Occasion)}
          className={inputClasses}
        >
          <option value="">Occasion (optional)</option>
          {OCCASIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className={inputClasses}
        aria-label="Event date (optional)"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="Date needed, number of guests, budget, anything specific"
        className={`${inputClasses} resize-none`}
      />
      {error && <p className="font-body text-small text-berry">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-berry px-8 py-3 font-body font-medium text-cream disabled:opacity-60"
      >
        {saving ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}

function MessagesPanel({
  session,
  conversation,
  messages,
  onConversationStarted,
  onMessageSent,
}: {
  session: Session;
  conversation: Conversation | null;
  messages: Message[];
  onConversationStarted: (conversation: Conversation) => void;
  onMessageSent: (message: Message) => void;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    let conversationId = conversation?.id;
    if (!conversationId) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ customer_id: session.user.id })
        .select("id, status, updated_at")
        .single();
      if (created) {
        conversationId = created.id;
        onConversationStarted(created);
      }
    }
    if (!conversationId) {
      setSending(false);
      return;
    }
    const { data: message } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "customer",
        sender_id: session.user.id,
        body: text.trim(),
      })
      .select("id, sender_type, body, created_at")
      .single();
    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (message) onMessageSent(message);
    setText("");
    setSending(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-small text-ink/60">
        Chat directly with Norvilah about an order, an inquiry, or anything else.
      </p>
      <div className="flex min-h-[240px] flex-col gap-3 rounded-panel bg-plaster/20 p-5">
        {messages.length === 0 ? (
          <p className="m-auto font-body text-body text-ink/50">
            No messages yet — send one below to start the conversation.
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[80%] rounded-panel px-4 py-2.5 font-body text-small ${
                message.sender_type === "customer"
                  ? "self-end bg-berry text-cream"
                  : "self-start bg-cream text-ink shadow-warm"
              }`}
            >
              {message.body}
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} className="flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className={`${inputClasses} flex-1`}
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-pill bg-berry px-6 py-3 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function FavouritesPanel({
  favourites,
  onChanged,
}: {
  favourites: Favourite[];
  onChanged: () => void;
}) {
  async function remove(id: string) {
    await supabase.from("favourites").delete().eq("id", id);
    onChanged();
  }

  return (
    <div className="flex flex-col gap-3">
      {favourites.length === 0 && (
        <EmptyState text="No favourites yet — tap the heart on a product in the menu to save it here." />
      )}
      {favourites.map((favourite) => (
        <div key={favourite.id} className="flex items-center justify-between rounded-panel bg-plaster/25 p-5">
          <p className="font-body text-body capitalize text-ink">
            {favourite.product_slug.replace(/-/g, " ")}
          </p>
          <div className="flex items-center gap-3">
            <Link href="/menu" className="font-body text-small font-medium text-berry">
              View in menu
            </Link>
            <button
              type="button"
              onClick={() => remove(favourite.id)}
              aria-label="Remove favourite"
              className="text-ink/40 transition-colors hover:text-berry"
            >
              <Heart className="size-4 fill-current" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
