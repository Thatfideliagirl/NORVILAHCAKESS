"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AdminProfile = {
  full_name: string | null;
  avatar_url: string | null;
};

type AdminSessionState = {
  status: "loading" | "unauthenticated" | "forbidden" | "ok";
  session: Session | null;
  profile: AdminProfile | null;
};

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({
    status: "loading",
    session: null,
    profile: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function check(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ status: "unauthenticated", session: null, profile: null });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url")
        .eq("id", session.user.id)
        .single();
      if (cancelled) return;
      setState({
        status: profile?.role === "admin" ? "ok" : "forbidden",
        session,
        profile: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : null,
      });
    }

    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      check(session);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
