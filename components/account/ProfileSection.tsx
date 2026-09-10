"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import Avatar from "@/components/Avatar";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";

type ProfileLike = {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  about: string | null;
  avatar_url: string | null;
};

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink";

export default function ProfileSection<T extends ProfileLike>({
  userId,
  profile,
  onSaved,
}: {
  userId: string;
  profile: T;
  onSaved: (profile: T) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {editing ? (
        <ProfileForm
          userId={userId}
          profile={profile}
          onSaved={(updated) => {
            onSaved(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="max-w-md rounded-panel bg-plaster/25 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar url={profile.avatar_url} name={profile.full_name} size={56} />
              <div>
                <p className="font-display text-product text-ink">{profile.full_name || "Add your name"}</p>
                <p className="mt-1 font-body text-small text-ink/60">{profile.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="Edit profile"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink/70 transition-colors hover:text-berry"
            >
              <Pencil className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <dl className="mt-5 flex flex-col gap-2 font-body text-small text-ink/70">
            <div className="flex justify-between">
              <dt className="text-ink/50">Phone</dt>
              <dd>{profile.phone || "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/50">Address</dt>
              <dd className="max-w-[70%] text-right">{profile.location || "-"}</dd>
            </div>
          </dl>
          {profile.about && (
            <p className="mt-4 border-t border-clay/15 pt-4 font-body text-small text-ink/70">
              {profile.about}
            </p>
          )}
        </div>
      )}
      {profile.email && <ChangePasswordForm email={profile.email} />}
    </div>
  );
}

function ProfileForm<T extends ProfileLike>({
  userId,
  profile,
  onSaved,
  onCancel,
}: {
  userId: string;
  profile: T;
  onSaved: (profile: T) => void;
  onCancel: () => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [about, setAbout] = useState(profile.about ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    let avatarUrl = profile.avatar_url;
    if (avatarFile) {
      const compressed = await compressImage(avatarFile, 512);
      const ext = compressed.name.split(".").pop();
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, compressed);
      if (!uploadError) {
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }
    }
    await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, location, about, avatar_url: avatarUrl })
      .eq("id", userId);
    setSaving(false);
    onSaved({ ...profile, full_name: fullName, phone, location, about, avatar_url: avatarUrl });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar url={avatarPreview ?? profile.avatar_url} name={fullName} size={56} />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setAvatarFile(file);
            setAvatarPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="font-body text-small text-ink"
        />
      </div>
      <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClasses} placeholder="Full name" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="Phone" />
      <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputClasses} placeholder="Address" />
      <textarea
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        rows={3}
        placeholder="About you (optional)"
        className={`${inputClasses} resize-none`}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-pill bg-cocoa px-8 py-3 font-body font-medium text-cream disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-body text-small font-medium text-ink/60"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
