"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

const STATUSES = ["new", "contacted", "in_progress", "completed"];

type Inquiry = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  occasion: string | null;
  event_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
  viewed_at: string | null;
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  function fetchInquiries() {
    return supabase
      .from("event_inquiries")
      .select("id, name, phone, email, occasion, event_date, message, status, created_at, viewed_at")
      .order("created_at", { ascending: false });
  }

  useEffect(() => {
    fetchInquiries().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setInquiries(data ?? []);
    });
  }, []);

  async function updateStatus(inquiry: Inquiry, status: string) {
    setInquiries((current) => current.map((i) => (i.id === inquiry.id ? { ...i, status } : i)));
    await supabase.from("event_inquiries").update({ status }).eq("id", inquiry.id);
  }

  async function markViewed(inquiry: Inquiry) {
    if (inquiry.viewed_at) return;
    const viewedAt = new Date().toISOString();
    setInquiries((current) => current.map((i) => (i.id === inquiry.id ? { ...i, viewed_at: viewedAt } : i)));
    await supabase.from("event_inquiries").update({ viewed_at: viewedAt }).eq("id", inquiry.id);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Events & Inquiries</p>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-4">
        {inquiries.length === 0 && (
          <p className="rounded-panel bg-cream p-6 text-center font-body text-body text-ink/50 shadow-warm">
            No inquiries yet.
          </p>
        )}
        {inquiries.map((inquiry) => (
          <div
            key={inquiry.id}
            onClick={() => markViewed(inquiry)}
            className={`rounded-panel p-5 shadow-warm ${!inquiry.viewed_at ? "bg-berry/5" : "bg-cream"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-product text-ink">
                  {inquiry.name}
                  {!inquiry.viewed_at && (
                    <span className="ml-2 rounded-pill bg-berry px-2 py-0.5 text-[10px] font-semibold text-cream">
                      New
                    </span>
                  )}
                </p>
                <p className="mt-1 font-body text-small text-ink/60">
                  {inquiry.phone}
                  {inquiry.email ? ` · ${inquiry.email}` : ""}
                  {inquiry.occasion ? ` · ${inquiry.occasion}` : ""}
                  {inquiry.event_date ? ` · ${inquiry.event_date}` : ""}
                </p>
              </div>
              <select
                value={inquiry.status}
                onChange={(e) => updateStatus(inquiry, e.target.value)}
                className="rounded-pill border border-clay/25 bg-cream px-3 py-1.5 text-xs capitalize"
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            {inquiry.message && (
              <p className="mt-3 font-body text-small text-ink/75">{inquiry.message}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
