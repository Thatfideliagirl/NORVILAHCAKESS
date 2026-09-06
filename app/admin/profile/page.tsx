"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/supabase/use-admin-session";
import ProfileSection from "@/components/account/ProfileSection";

type Profile = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  about: string | null;
  avatar_url: string | null;
};

export default function AdminProfilePage() {
  const { session } = useAdminSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from("profiles")
      .select("full_name, email, phone, location, about, avatar_url")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [session]);

  if (!session || !profile) {
    return (
      <div>
        <p className="font-display text-heading text-berry">Profile</p>
        <p className="mt-2 font-body text-body text-ink/60">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Profile</p>
      <p className="mt-2 font-body text-body text-ink/60">Your admin account details.</p>
      <div className="mt-8">
        <ProfileSection userId={session.user.id} profile={profile} onSaved={setProfile} />
      </div>
    </div>
  );
}
