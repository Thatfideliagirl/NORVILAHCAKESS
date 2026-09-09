"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

type InquiryDetail = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  occasion: string | null;
  event_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

export default function InquiryDetailModal({
  inquiryId,
  onClose,
}: {
  inquiryId: string;
  onClose: () => void;
}) {
  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);

  useEffect(() => {
    supabase
      .from("event_inquiries")
      .select("id, name, phone, email, occasion, event_date, message, status, created_at")
      .eq("id", inquiryId)
      .single<InquiryDetail>()
      .then(({ data }) => setInquiry(data));
  }, [inquiryId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-cocoa/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 top-1/2 z-[110] mx-auto max-h-[85vh] max-w-lg -translate-y-1/2 overflow-y-auto rounded-panel bg-cream p-6 shadow-warm-lg"
      >
        <div className="flex items-start justify-between">
          <p className="font-display text-product text-berry">
            {inquiry ? inquiry.occasion ?? "Event Inquiry" : "Inquiry"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-plaster/40 text-ink"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        </div>

        {!inquiry ? (
          <p className="mt-6 font-body text-body text-ink/60">Loading...</p>
        ) : (
          <div className="mt-4 flex flex-col gap-4 font-body text-small text-ink">
            <span className="w-fit rounded-pill bg-plaster/40 px-3 py-1 text-xs font-semibold capitalize text-ink/70">
              {inquiry.status.replace("_", " ")}
            </span>

            <div className="rounded-panel bg-plaster/20 p-4">
              <p>
                <span className="text-ink/50">Name: </span>
                {inquiry.name}
              </p>
              <p className="mt-1">
                <span className="text-ink/50">Phone: </span>
                {inquiry.phone}
              </p>
              {inquiry.email && (
                <p className="mt-1">
                  <span className="text-ink/50">Email: </span>
                  {inquiry.email}
                </p>
              )}
              {inquiry.occasion && (
                <p className="mt-1">
                  <span className="text-ink/50">Occasion: </span>
                  {inquiry.occasion}
                </p>
              )}
              {inquiry.event_date && (
                <p className="mt-1">
                  <span className="text-ink/50">Event date: </span>
                  {inquiry.event_date}
                </p>
              )}
              <p className="mt-1">
                <span className="text-ink/50">Sent: </span>
                {new Date(inquiry.created_at).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div>
              <p className="font-body text-small font-medium text-ink/70">Message</p>
              <p className="mt-1 rounded-panel bg-plaster/20 p-4 text-ink/85">
                {inquiry.message || "No message provided."}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
