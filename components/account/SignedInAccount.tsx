"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_naira: number;
  created_at: string;
};

type Inquiry = {
  id: string;
  occasion: string | null;
  event_date: string | null;
  status: string;
  created_at: string;
};

type Conversation = {
  id: string;
  status: string;
  updated_at: string;
};

const TABS = ["Orders", "Inquiries", "Messages", "Profile"] as const;
type Tab = (typeof TABS)[number];

export default function SignedInAccount({ session }: { session: Session }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("Orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("full_name, email, phone, location")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session.user.id]);

  useEffect(() => {
    if (tab === "Orders") {
      supabase
        .from("orders")
        .select("id, order_number, status, total_naira, created_at")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setOrders(data ?? []));
    }
    if (tab === "Inquiries") {
      supabase
        .from("event_inquiries")
        .select("id, occasion, event_date, status, created_at")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => setInquiries(data ?? []));
    }
    if (tab === "Messages") {
      supabase
        .from("conversations")
        .select("id, status, updated_at")
        .eq("customer_id", session.user.id)
        .order("updated_at", { ascending: false })
        .then(({ data }) => setConversations(data ?? []));
    }
  }, [tab, session.user.id]);

  return (
    <main className="min-h-screen bg-cream px-6 pb-24 pt-32">
      <div className="mx-auto max-w-content">
        <p className="font-display text-heading text-berry">
          Welcome, {profile?.full_name?.split(" ")[0] || "there"}{" "}
          <span aria-hidden="true">👋</span>
        </p>
        <p className="mt-2 font-body text-lead text-ink/70">
          {profile?.email}
          {profile?.phone ? ` · ${profile.phone}` : ""}
        </p>

        <div className="mt-8 flex gap-2 overflow-x-auto">
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
        </div>

        <div className="mt-8">
          {tab === "Orders" && (
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

          {tab === "Inquiries" && (
            <div className="flex flex-col gap-3">
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
          )}

          {tab === "Messages" && (
            <div className="flex flex-col gap-3">
              {conversations.length === 0 && <EmptyState text="No messages yet." />}
              {conversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between rounded-panel bg-plaster/25 p-5">
                  <p className="font-body text-body text-ink">Conversation</p>
                  <span className="rounded-pill bg-berry/15 px-4 py-1.5 text-xs font-semibold capitalize text-berry">
                    {conversation.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === "Profile" && profile && (
            <ProfileForm userId={session.user.id} profile={profile} onSaved={setProfile} />
          )}
        </div>

        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-10 rounded-pill border border-clay px-8 py-3 font-body font-medium text-ink transition-colors duration-200 hover:bg-clay/10"
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

function ProfileForm({
  userId,
  profile,
  onSaved,
}: {
  userId: string;
  profile: Profile;
  onSaved: (profile: Profile) => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, location })
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    onSaved({ ...profile, full_name: fullName, phone, location });
  }

  const inputClasses =
    "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink";

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClasses} placeholder="Full name" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="Phone" />
      <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClasses} placeholder="Location" />
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-cocoa px-8 py-3 font-body font-medium text-cream disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
      {saved && <p className="font-body text-small text-berry">Saved.</p>}
    </form>
  );
}
