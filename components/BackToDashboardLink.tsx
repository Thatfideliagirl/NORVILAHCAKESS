"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// Mounted globally in the root layout so it's available on any page a
// logged-in customer or admin might land on (menu, cart, checkout, etc.),
// not just one hero section. Hidden on /account and /admin since those
// pages already are the dashboard.
export default function BackToDashboardLink() {
  const pathname = usePathname();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    function checkSession(userId: string | undefined) {
      if (!userId) {
        setHref(null);
        return;
      }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
        .then(({ data: profile }) => setHref(profile?.role === "admin" ? "/admin" : "/account"));
    }

    supabase.auth.getSession().then(({ data }) => checkSession(data.session?.user.id));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      checkSession(session?.user.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!href || pathname?.startsWith("/account") || pathname?.startsWith("/admin")) return null;

  return (
    <Link
      href={href}
      className="fixed left-6 top-24 z-30 flex items-center gap-2 rounded-pill bg-cream/90 px-4 py-2 font-body text-small font-medium text-ink shadow-warm transition-colors hover:bg-cream active:bg-cream md:left-11"
    >
      <ArrowLeft className="size-4" strokeWidth={1.75} />
      Back to Dashboard
    </Link>
  );
}
