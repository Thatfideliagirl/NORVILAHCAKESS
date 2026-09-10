"use client";

import Link from "next/link";

// Where the confirmation email's link (not the code) lands. Supabase's
// client auto-detects the tokens in this page's URL and signs the
// customer in on its own, so this page doesn't need to do that itself --
// it just needs to exist so a link click ends up somewhere reassuring
// instead of a blank or unrelated page.
export default function AccountConfirmedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
      <div className="max-w-sm">
        <p className="font-display text-heading text-berry">You&apos;re confirmed! 🎉</p>
        <p className="mt-4 font-body text-body text-ink/70">
          Your email is verified and your Norvilah Cakes account is ready to go.
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
