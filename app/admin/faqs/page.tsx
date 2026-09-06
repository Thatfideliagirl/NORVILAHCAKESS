"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Faq = {
  id: string;
  question: string;
  answer: string;
  active: boolean;
};

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  function fetchFaqs() {
    return supabase.from("faqs").select("id, question, answer, active").order("sort_order");
  }

  useEffect(() => {
    fetchFaqs().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setFaqs(data ?? []);
    });
  }, []);

  async function addFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    await supabase.from("faqs").insert({ question: question.trim(), answer: answer.trim() });
    setQuestion("");
    setAnswer("");
    setSaving(false);
    fetchFaqs().then(({ data }) => setFaqs(data ?? []));
  }

  async function toggleActive(faq: Faq) {
    setFaqs((current) => current.map((f) => (f.id === faq.id ? { ...f, active: !f.active } : f)));
    await supabase.from("faqs").update({ active: !faq.active }).eq("id", faq.id);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">FAQs</p>

      <form onSubmit={addFaq} className="mt-6 flex max-w-xl flex-col gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Question"
          className="rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink"
        />
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Answer"
          rows={3}
          className="resize-none rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink"
        />
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Add FAQ
        </button>
      </form>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-3">
        {faqs.map((faq) => (
          <div key={faq.id} className="rounded-panel bg-cream p-5 shadow-warm">
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-product text-ink">{faq.question}</p>
              <button
                type="button"
                onClick={() => toggleActive(faq)}
                className={`shrink-0 rounded-pill px-4 py-1.5 text-xs font-semibold ${
                  faq.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
                }`}
              >
                {faq.active ? "Active" : "Inactive"}
              </button>
            </div>
            <p className="mt-2 font-body text-small text-ink/70">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
