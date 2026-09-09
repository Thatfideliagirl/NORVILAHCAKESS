"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";
import InquiryDetailModal from "@/components/InquiryDetailModal";

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
  const [detailId, setDetailId] = useState<string | null>(null);

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

  async function toggleViewed(inquiry: Inquiry) {
    const nextViewedAt = inquiry.viewed_at ? null : new Date().toISOString();
    setInquiries((current) =>
      current.map((i) => (i.id === inquiry.id ? { ...i, viewed_at: nextViewedAt } : i))
    );
    const { error } = await supabase
      .from("event_inquiries")
      .update({ viewed_at: nextViewedAt })
      .eq("id", inquiry.id);
    if (error) setLoadError(error.message);
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
          <button
            type="button"
            key={inquiry.id}
            onClick={() => setDetailId(inquiry.id)}
            className={`rounded-panel p-5 text-left shadow-warm transition-colors ${
              !inquiry.viewed_at ? "bg-berry/5 hover:bg-berry/10" : "bg-cream hover:bg-plaster/20"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-display text-product text-ink">{inquiry.name}</p>
                <p className="mt-1 font-body text-small text-ink/60">
                  {inquiry.phone}
                  {inquiry.email ? ` · ${inquiry.email}` : ""}
                  {inquiry.occasion ? ` · ${inquiry.occasion}` : ""}
                  {inquiry.event_date ? ` · ${inquiry.event_date}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => toggleViewed(inquiry)}
                  title="Click to toggle New / Seen"
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${
                    !inquiry.viewed_at ? "bg-berry text-cream" : "bg-clay/15 text-ink/50"
                  }`}
                >
                  {inquiry.viewed_at ? "Seen" : "New"}
                </button>
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
            </div>
            {inquiry.message && (
              <p className="mt-3 font-body text-small text-ink/75">{inquiry.message}</p>
            )}
          </button>
        ))}
      </div>

      {detailId && <InquiryDetailModal inquiryId={detailId} onClose={() => setDetailId(null)} />}
    </div>
  );
}
