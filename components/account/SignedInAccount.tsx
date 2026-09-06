"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { Heart, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import { OCCASIONS, type Occasion } from "@/lib/whatsapp";
import { markMessagesRead } from "@/lib/supabase/messages";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/NotificationBell";
import ProfileSection from "@/components/account/ProfileSection";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
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

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  is_default: boolean;
};

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

const TABS = ["Overview", "My Orders", "My Inquiries", "Messages", "Addresses", "Favourites", "Profile Settings"] as const;
type Tab = (typeof TABS)[number];

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink";

export default function SignedInAccount({ session }: { session: Session }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryFormOpen, setInquiryFormOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [favourites, setFavourites] = useState<Favourite[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesLoaded = useRef(false);

  function fetchProfile() {
    return supabase
      .from("profiles")
      .select("full_name, email, phone, location, role, avatar_url, created_at")
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
      .select("id, order_number, status, total_naira, created_at")
      .eq("customer_id", session.user.id)
      .order("created_at", { ascending: false })
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

  function fetchAddresses() {
    return supabase
      .from("saved_addresses")
      .select("id, label, address, is_default")
      .eq("customer_id", session.user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => setAddresses(data ?? []));
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
    fetchAddresses();
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

  const activeOrders = orders.filter((o) => !PAST_STATUSES.includes(o.status)).length;
  const pastOrders = orders.filter((o) => PAST_STATUSES.includes(o.status)).length;
  const inquiriesInProgress = inquiries.filter((i) => OPEN_INQUIRY_STATUSES.includes(i.status)).length;

  return (
    <main className="min-h-screen bg-cream px-6 pb-24 pt-32">
      <div className="mx-auto max-w-content">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={56} />
            <div>
              <p className="font-display text-heading text-berry">
                Welcome, {profile?.full_name?.split(" ")[0] || "there"}{" "}
                <span aria-hidden="true">👋</span>
              </p>
              <p className="mt-1 font-body text-small text-ink/70">
                {profile?.email}
                {profile?.phone ? ` · ${profile.phone}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell role="customer" onSelectMessage={() => setTab("Messages")} />
            <button
              type="button"
              onClick={() => setTab("Messages")}
              className="hidden rounded-pill bg-berry px-5 py-2.5 font-body text-small font-medium text-cream sm:inline-block"
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

        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 rounded-pill px-5 py-2 font-body text-small font-medium transition-colors ${
                tab === t ? "bg-berry text-cream" : "bg-plaster/40 text-ink/70"
              }`}
            >
              {t}
            </button>
          ))}
          <Link
            href="/menu"
            className="shrink-0 rounded-pill border border-clay/30 px-5 py-2 font-body text-small font-medium text-ink/70 transition-colors hover:bg-plaster/40"
          >
            Menu
          </Link>
        </div>

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
                  <p className="font-display text-product text-ink">Latest order</p>
                  <div className="mt-3 flex items-center justify-between rounded-panel bg-plaster/25 p-5">
                    <div>
                      <p className="font-display text-body text-ink">{orders[0].order_number}</p>
                      <p className="mt-1 font-body text-small capitalize text-ink/60">
                        {orders[0].status.replace("_", " ")}
                      </p>
                    </div>
                    <p className="font-body text-body font-semibold text-berry">
                      {formatNaira(orders[0].total_naira)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "My Orders" && (
            <div className="flex flex-col gap-3">
              {orders.length === 0 && <EmptyState text="No orders yet." />}
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-panel bg-plaster/25 p-5">
                  <div>
                    <p className="font-display text-product text-ink">{order.order_number}</p>
                    <p className="mt-1 font-body text-small capitalize text-ink/60">
                      {order.status.replace("_", " ")}
                    </p>
                  </div>
                  <p className="font-body text-body font-semibold text-berry">
                    {formatNaira(order.total_naira)}
                  </p>
                </div>
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

          {tab === "Addresses" && (
            <AddressesPanel session={session} addresses={addresses} onChanged={fetchAddresses} />
          )}

          {tab === "Favourites" && (
            <FavouritesPanel favourites={favourites} onChanged={fetchFavourites} />
          )}

          {tab === "Profile Settings" && profile && (
            <ProfileSection userId={session.user.id} profile={profile} onSaved={setProfile} />
          )}
        </div>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-10 block rounded-pill border border-clay px-8 py-3 font-body font-medium text-ink transition-colors duration-200 hover:bg-clay/10"
        >
          Sign out
        </button>
      </div>
    </main>
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

function AddressesPanel({
  session,
  addresses,
  onChanged,
}: {
  session: Session;
  addresses: SavedAddress[];
  onChanged: () => void;
}) {
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;
    setSaving(true);
    await supabase.from("saved_addresses").insert({
      customer_id: session.user.id,
      label: label.trim() || "Home",
      address: address.trim(),
      is_default: addresses.length === 0,
    });
    setLabel("Home");
    setAddress("");
    setSaving(false);
    onChanged();
  }

  async function removeAddress(id: string) {
    await supabase.from("saved_addresses").delete().eq("id", id);
    onChanged();
  }

  async function makeDefault(id: string) {
    await supabase.from("saved_addresses").update({ is_default: false }).eq("customer_id", session.user.id);
    await supabase.from("saved_addresses").update({ is_default: true }).eq("id", id);
    onChanged();
  }

  return (
    <div>
      <form onSubmit={addAddress} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (Home, Work...)"
          className={`${inputClasses} sm:w-40`}
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full delivery address"
          className={`${inputClasses} flex-1`}
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-pill bg-cocoa px-6 py-3 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Add
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3">
        {addresses.length === 0 && <EmptyState text="No saved addresses yet." />}
        {addresses.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-panel bg-plaster/25 p-5">
            <div>
              <p className="font-display text-body text-ink">
                {a.label}
                {a.is_default && (
                  <span className="ml-2 rounded-pill bg-berry/15 px-3 py-1 text-xs font-semibold text-berry">
                    Default
                  </span>
                )}
              </p>
              <p className="mt-1 font-body text-small text-ink/60">{a.address}</p>
            </div>
            <div className="flex items-center gap-3">
              {!a.is_default && (
                <button
                  type="button"
                  onClick={() => makeDefault(a.id)}
                  className="font-body text-small font-medium text-berry"
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                onClick={() => removeAddress(a.id)}
                aria-label="Remove address"
                className="text-ink/40 transition-colors hover:text-berry"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ))}
      </div>
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
