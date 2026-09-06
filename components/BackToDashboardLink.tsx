"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function BackToDashboardLink() {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) {
        setHref(null);
        return;
      }
      supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data: profile }) => setHref(profile?.role === "admin" ? "/admin" : "/account"));
    });
  }, []);

  if (!href) return null;

  return (
    <Link
      href={href}
      className="absolute left-6 top-24 z-10 flex items-center gap-2 rounded-pill bg-cream/90 px-4 py-2 font-body text-small font-medium text-ink shadow-warm transition-colors hover:bg-cream md:left-11"
    >
      <ArrowLeft className="size-4" strokeWidth={1.75} />
      Back to Dashboard
    </Link>
  );
}
