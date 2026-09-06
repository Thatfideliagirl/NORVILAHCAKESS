"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AdminSessionState = {
  status: "loading" | "unauthenticated" | "forbidden" | "ok";
  session: Session | null;
};

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({ status: "loading", session: null });

  useEffect(() => {
    let cancelled = false;

    async function check(session: Session | null) {
      if (!session) {
        if (!cancelled) setState({ status: "unauthenticated", session: null });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (cancelled) return;
      setState({
        status: profile?.role === "admin" ? "ok" : "forbidden",
        session,
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
