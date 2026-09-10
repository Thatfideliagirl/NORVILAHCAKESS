"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink";

export default function ChangePasswordForm({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      // Re-checks the current password before allowing a change -- an
      // active session alone isn't proof enough on a shared device.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (verifyError) {
        setError("Current password is incorrect.");
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError("Could not update your password. Please try again.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setSuccess(true);
    } catch {
      setError("Could not reach the account service. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md rounded-panel bg-plaster/25 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-display text-product text-ink">Password</p>
          <p className="mt-1 font-body text-small text-ink/60">Change your account password.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            setError(null);
            setSuccess(false);
          }}
          className="shrink-0 font-body text-small font-medium text-berry"
        >
          {open ? "Close" : "Change"}
        </button>
      </div>

      {open && (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
          <input
            type="password"
            required
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClasses}
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (at least 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClasses}
          />
          {error && <p className="font-body text-small text-berry">{error}</p>}
          {success && <p className="font-body text-small text-ink/60">Password updated.</p>}
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save new password"}
          </button>
        </form>
      )}
    </div>
  );
}
