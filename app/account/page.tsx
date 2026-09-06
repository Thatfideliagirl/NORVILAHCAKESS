"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { categories } from "@/data/categories";
import SignedInAccount from "@/components/account/SignedInAccount";

const HOW_HEARD_OPTIONS = [
  "Instagram",
  "WhatsApp",
  "A friend or family member",
  "Google search",
  "Just came across it",
];

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink placeholder:text-ink/40 focus-visible:border-berry";

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [checkEmailFor, setCheckEmailFor] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      Promise.resolve().then(() => setIsAdmin(null));
      return;
    }
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.role === "admin"));
  }, [session]);

  useEffect(() => {
    if (isAdmin) router.replace("/admin");
  }, [isAdmin, router]);

  if (session === undefined || (session && isAdmin === null) || isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24">
        <p className="font-body text-body text-ink/60">Loading...</p>
      </main>
    );
  }

  if (session) {
    return <SignedInAccount session={session} />;
  }

  if (checkEmailFor) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
        <div className="max-w-sm">
          <p className="font-display text-heading text-berry">Check your email</p>
          <p className="mt-4 font-body text-body text-ink/70">
            We sent a verification link to <strong>{checkEmailFor}</strong>.
            Confirm it to finish creating your account, then come back here
            to sign in.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 pb-24 pt-32">
      <div className="mx-auto max-w-md">
        <div className="flex gap-2 rounded-pill bg-plaster/40 p-1">
          <button
            type="button"
            onClick={() => setMode("signIn")}
            className={`flex-1 rounded-pill py-2.5 font-body text-small font-medium transition-colors ${
              mode === "signIn" ? "bg-berry text-cream" : "text-ink/60"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setMode("signUp")}
            className={`flex-1 rounded-pill py-2.5 font-body text-small font-medium transition-colors ${
              mode === "signUp" ? "bg-berry text-cream" : "text-ink/60"
            }`}
          >
            Sign up
          </button>
        </div>

        {mode === "signIn" ? (
          <SignInForm />
        ) : (
          <SignUpForm onSignedUp={(email) => setCheckEmailFor(email)} />
        )}
      </div>
    </main>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } catch {
      setError("Could not reach the account service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <h1 className="font-display text-product text-ink">Welcome back</h1>
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClasses}
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClasses}
      />
      {error && <p className="font-body text-small text-berry">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}

function SignUpForm({ onSignedUp }: { onSignedUp: (email: string) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [howHeard, setHowHeard] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const togglePreference = (name: string) => {
    setPreferences((current) =>
      current.includes(name) ? current.filter((p) => p !== name) : [...current, name]
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/account`,
          data: {
            full_name: fullName,
            phone,
            location,
            how_heard: howHeard,
            preferences,
          },
        },
      });
      if (error) {
        setError(error.message);
        return;
      }
      onSignedUp(email);
    } catch {
      setError("Could not reach the account service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <h1 className="font-display text-product text-ink">Create your account</h1>
      <input
        required
        placeholder="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className={inputClasses}
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClasses}
      />
      <input
        type="tel"
        required
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={inputClasses}
      />
      <input
        required
        placeholder="Location (e.g. Egbeda, Lagos)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className={inputClasses}
      />
      <select
        required
        value={howHeard}
        onChange={(e) => setHowHeard(e.target.value)}
        className={inputClasses}
      >
        <option value="" disabled>
          How did you hear about us?
        </option>
        {HOW_HEARD_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <div>
        <p className="font-body text-small font-medium text-ink/70">
          What do you love ordering? (optional)
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = preferences.includes(category.name);
            return (
              <button
                type="button"
                key={category.slug}
                onClick={() => togglePreference(category.name)}
                className={`rounded-pill border px-4 py-1.5 font-body text-small transition-colors ${
                  active
                    ? "border-berry bg-berry text-cream"
                    : "border-clay/30 text-ink/70 hover:border-clay"
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <input
        type="password"
        required
        minLength={8}
        placeholder="Password (at least 8 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className={inputClasses}
      />

      {error && <p className="font-body text-small text-berry">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
