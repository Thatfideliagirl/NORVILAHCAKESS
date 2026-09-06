"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Settings = {
  website_ordering_enabled: boolean;
  whatsapp_ordering_enabled: boolean;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
};

function fetchSettings() {
  return supabase
    .from("settings")
    .select(
      "website_ordering_enabled, whatsapp_ordering_enabled, bank_name, bank_account_name, bank_account_number"
    )
    .eq("id", true)
    .single();
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setSettings(data ?? null);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("settings")
      .update({
        website_ordering_enabled: settings.website_ordering_enabled,
        whatsapp_ordering_enabled: settings.whatsapp_ordering_enabled,
        bank_name: settings.bank_name,
        bank_account_name: settings.bank_account_name,
        bank_account_number: settings.bank_account_number,
      })
      .eq("id", true);
    if (error) setLoadError(error.message);
    else setSaved(true);
    setSaving(false);
  }

  const inputClasses =
    "w-full rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink";

  return (
    <div>
      <p className="font-display text-heading text-berry">Settings</p>
      <p className="mt-2 font-body text-body text-ink/60">
        Control which order channels are open and the bank account customers transfer to.
      </p>

      {loadError && <AdminErrorBanner message={loadError} />}

      {settings && (
        <form onSubmit={save} className="mt-8 flex max-w-lg flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-body text-small font-semibold text-ink/70">Order channels</p>
            <label className="flex items-center gap-3 font-body text-body text-ink">
              <input
                type="checkbox"
                checked={settings.website_ordering_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, website_ordering_enabled: e.target.checked })
                }
              />
              Accept orders via Website
            </label>
            <label className="flex items-center gap-3 font-body text-body text-ink">
              <input
                type="checkbox"
                checked={settings.whatsapp_ordering_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, whatsapp_ordering_enabled: e.target.checked })
                }
              />
              Accept orders via WhatsApp
            </label>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-body text-small font-semibold text-ink/70">
              Bank transfer details (shown to customers at checkout)
            </p>
            <input
              placeholder="Bank name"
              value={settings.bank_name ?? ""}
              onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
              className={inputClasses}
            />
            <input
              placeholder="Account name"
              value={settings.bank_account_name ?? ""}
              onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
              className={inputClasses}
            />
            <input
              placeholder="Account number"
              value={settings.bank_account_number ?? ""}
              onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="self-start rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && <p className="font-body text-small text-berry">Saved.</p>}
          </div>
        </form>
      )}
    </div>
  );
}
