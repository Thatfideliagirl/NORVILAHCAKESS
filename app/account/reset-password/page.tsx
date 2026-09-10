"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink placeholder:text-ink/40 focus-visible:border-berry";

// Where the "reset your password" email's link lands. Supabase's client
// auto-detects the recovery tokens in this page's URL and starts a
// (temporary) session on its own -- enough to call updateUser, but not a
// normal signed-in session, so this page doesn't try to reuse it for
// anything beyond setting the new password.
export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setValidLink(!!data.session);
      setReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setValidLink(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError("Could not update your password. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the account service. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24">
        <p className="font-body text-body text-ink/60">Loading...</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
        <div className="max-w-sm">
          <p className="font-display text-heading text-berry">Password updated 🎉</p>
          <p className="mt-4 font-body text-body text-ink/70">
            You&apos;re all set. Head back to your account to keep going.
          </p>
          <Link
            href="/account"
            className="mt-8 inline-block rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink"
          >
            Go to My Account
          </Link>
        </div>
      </main>
    );
  }

  if (!validLink) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
        <div className="max-w-sm">
          <p className="font-display text-heading text-berry">This link has expired</p>
          <p className="mt-4 font-body text-body text-ink/70">
            Password reset links only work for a little while. Head back and request a new one.
          </p>
          <Link
            href="/account"
            className="mt-8 inline-block rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink"
          >
            Back to log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-heading text-berry">Set a new password</p>
        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (at least 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClasses}
          />
          {error && <p className="font-body text-small text-berry">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink disabled:opacity-60"
          >
            {saving ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </main>
  );
}
