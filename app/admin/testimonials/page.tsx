"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Testimonial = {
  id: string;
  quote: string;
  name: string;
  active: boolean;
};

const fieldClasses =
  "rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink";

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function fetchTestimonials() {
    return supabase.from("testimonials").select("id, quote, name, active").order("sort_order");
  }

  useEffect(() => {
    fetchTestimonials().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setTestimonials(data ?? []);
    });
  }, []);

  async function addTestimonial(e: React.FormEvent) {
    e.preventDefault();
    if (!quote.trim() || !name.trim()) return;
    setSaving(true);
    await supabase.from("testimonials").insert({ quote: quote.trim(), name: name.trim() });
    setQuote("");
    setName("");
    setSaving(false);
    fetchTestimonials().then(({ data }) => setTestimonials(data ?? []));
  }

  async function toggleActive(testimonial: Testimonial) {
    setTestimonials((current) =>
      current.map((t) => (t.id === testimonial.id ? { ...t, active: !t.active } : t))
    );
    await supabase.from("testimonials").update({ active: !testimonial.active }).eq("id", testimonial.id);
  }

  async function deleteTestimonial(testimonial: Testimonial) {
    if (!window.confirm(`Delete this testimonial from "${testimonial.name}"? This can't be undone.`)) return;
    setTestimonials((current) => current.filter((t) => t.id !== testimonial.id));
    await supabase.from("testimonials").delete().eq("id", testimonial.id);
  }

  function onSaved(updated: Testimonial) {
    setTestimonials((current) => current.map((t) => (t.id === updated.id ? updated : t)));
    setEditingId(null);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Testimonials</p>
      <p className="mt-2 font-body text-body text-ink/60">
        Reviews shown in the &quot;Cravings approved&quot; section on the landing page.
      </p>

      <form onSubmit={addTestimonial} className="mt-6 flex max-w-xl flex-col gap-3">
        <textarea
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="What the customer said"
          rows={3}
          className={`${fieldClasses} resize-none`}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Customer name (e.g. Teni A.)"
          className={fieldClasses}
        />
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Add Testimonial
        </button>
      </form>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-3">
        {testimonials.length === 0 && (
          <p className="rounded-panel bg-cream p-6 text-center font-body text-body text-ink/50 shadow-warm">
            No testimonials yet.
          </p>
        )}
        {testimonials.map((testimonial) =>
          editingId === testimonial.id ? (
            <EditTestimonialForm
              key={testimonial.id}
              testimonial={testimonial}
              onSaved={onSaved}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div key={testimonial.id} className="rounded-panel bg-cream p-5 shadow-warm">
              <div className="flex items-start justify-between gap-4">
                <p className="font-display text-product text-ink">{testimonial.name}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(testimonial)}
                    className={`rounded-pill px-4 py-1.5 text-xs font-semibold ${
                      testimonial.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
                    }`}
                  >
                    {testimonial.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(testimonial.id)}
                    className="font-body text-small font-medium text-berry"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTestimonial(testimonial)}
                    className="font-body text-small font-medium text-ink/50 hover:text-berry"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 font-body text-small text-ink/70">&ldquo;{testimonial.quote}&rdquo;</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EditTestimonialForm({
  testimonial,
  onSaved,
  onCancel,
}: {
  testimonial: Testimonial;
  onSaved: (testimonial: Testimonial) => void;
  onCancel: () => void;
}) {
  const [quote, setQuote] = useState(testimonial.quote);
  const [name, setName] = useState(testimonial.name);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!quote.trim() || !name.trim()) return;
    setSaving(true);
    const updated = { quote: quote.trim(), name: name.trim() };
    await supabase.from("testimonials").update(updated).eq("id", testimonial.id);
    setSaving(false);
    onSaved({ ...testimonial, ...updated });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-panel bg-plaster/25 p-5">
      <textarea
        value={quote}
        onChange={(e) => setQuote(e.target.value)}
        rows={3}
        className={`${fieldClasses} resize-none`}
      />
      <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClasses} />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-pill bg-cocoa px-6 py-2 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className="font-body text-small font-medium text-ink/60">
          Cancel
        </button>
      </div>
    </form>
  );
}
