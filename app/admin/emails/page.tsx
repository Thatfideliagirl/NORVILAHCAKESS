"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Template = {
  key: string;
  subject: string;
  body: string;
};

const TEMPLATE_INFO: Record<string, { title: string; description: string; tokens: string[] }> = {
  welcome: {
    title: "Welcome email",
    description: "Sent automatically the moment someone creates an account.",
    tokens: ["{{name}}"],
  },
  order_confirmation: {
    title: "Order confirmation email",
    description: "Sent automatically to the customer right after they place an order.",
    tokens: [
      "{{name}}",
      "{{order_number}}",
      "{{order_items}}",
      "{{order_total}}",
      "{{delivery_location}}",
    ],
  },
  admin_new_order: {
    title: "New order notification (to you)",
    description: "Sent to your notification email (Admin -> Settings) the moment a customer places an order.",
    tokens: [
      "{{order_number}}",
      "{{customer_name}}",
      "{{customer_phone}}",
      "{{order_items}}",
      "{{order_total}}",
      "{{delivery_location}}",
      "{{order_channel}}",
      "{{payment_method}}",
    ],
  },
  admin_new_signup: {
    title: "New customer signup (to you)",
    description: "Sent to your notification email (Admin -> Settings) the moment someone creates an account.",
    tokens: [
      "{{customer_name}}",
      "{{customer_email}}",
      "{{customer_phone}}",
      "{{customer_location}}",
      "{{how_heard}}",
    ],
  },
};

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink";

function TemplateCard({ template, onSaved }: { template: Template; onSaved: (t: Template) => void }) {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const info = TEMPLATE_INFO[template.key];

  async function save() {
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("email_templates")
      .update({ subject, body, updated_at: new Date().toISOString() })
      .eq("key", template.key);
    setSaving(false);
    if (!error) {
      setSaved(true);
      onSaved({ key: template.key, subject, body });
      setTimeout(() => setSaved(false), 2500);
    }
  }

  return (
    <div className="rounded-panel bg-cream p-6 shadow-warm">
      <p className="font-display text-product text-berry">{info?.title ?? template.key}</p>
      {info?.description && (
        <p className="mt-1 font-body text-small text-ink/60">{info.description}</p>
      )}
      {info?.tokens && (
        <p className="mt-2 font-body text-xs text-ink/50">
          Available placeholders: {info.tokens.join(", ")}
        </p>
      )}

      <label className="mt-4 block font-body text-small font-medium text-ink/70">Subject</label>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className={`${inputClasses} mt-1`}
      />

      <label className="mt-4 block font-body text-small font-medium text-ink/70">Body</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={10}
        className={`${inputClasses} mt-1 resize-y`}
      />

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <p className="font-body text-small text-berry">Saved.</p>}
      </div>
    </div>
  );
}

export default function AdminEmailsPage() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("email_templates")
      .select("key, subject, body")
      .order("key")
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        setTemplates(data ?? []);
      });
  }, []);

  return (
    <div>
      <p className="font-display text-heading text-berry">Emails</p>
      <p className="mt-2 font-body text-body text-ink/60">
        The automatic emails customers receive. Edit the wording here any time -- changes apply
        to the very next email sent, no code change needed.
      </p>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-6">
        {templates?.map((t) => (
          <TemplateCard
            key={t.key}
            template={t}
            onSaved={(updated) =>
              setTemplates((current) =>
                current ? current.map((x) => (x.key === updated.key ? updated : x)) : current
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
