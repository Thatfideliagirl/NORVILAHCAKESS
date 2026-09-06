"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  starts_at: string;
  ends_at: string | null;
};

function fetchAnnouncements() {
  return supabase
    .from("announcements")
    .select("id, title, description, image_url, active, starts_at, ends_at")
    .order("starts_at", { ascending: false })
    .returns<Announcement[]>();
}

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink";

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchAnnouncements().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setAnnouncements(data ?? []);
    });
  }, []);

  async function toggleActive(announcement: Announcement) {
    setAnnouncements((current) =>
      current.map((a) => (a.id === announcement.id ? { ...a, active: !a.active } : a))
    );
    await supabase.from("announcements").update({ active: !announcement.active }).eq("id", announcement.id);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this broadcast? This can't be undone.")) return;
    setAnnouncements((current) => current.filter((a) => a.id !== id));
    await supabase.from("announcements").delete().eq("id", id);
  }

  function onAdded(created: Announcement) {
    setAnnouncements((current) => [created, ...current]);
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-heading text-berry">Broadcasts</p>
          <p className="mt-2 font-body text-body text-ink/60">
            A popup message anyone sees when they visit the site while it&apos;s active — a sale, a
            schedule change, a new product launch.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((current) => !current)}
          className="shrink-0 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream"
        >
          {adding ? "Close" : "New Broadcast"}
        </button>
      </div>

      {adding && (
        <div className="mt-6 rounded-panel bg-plaster/25 p-5">
          <AddAnnouncementForm onAdded={onAdded} />
        </div>
      )}

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 flex flex-col gap-3">
        {announcements.length === 0 && (
          <p className="rounded-panel bg-cream p-6 text-center font-body text-body text-ink/50 shadow-warm">
            No broadcasts yet.
          </p>
        )}
        {announcements.map((announcement) => (
          <div key={announcement.id} className="flex items-center gap-4 rounded-panel bg-cream p-5 shadow-warm">
            {announcement.image_url && (
              <div className="relative size-14 shrink-0 overflow-hidden rounded-panel">
                <Image src={announcement.image_url} alt={announcement.title} fill sizes="56px" className="object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display text-body text-ink">{announcement.title}</p>
              <p className="mt-1 font-body text-small text-ink/60">
                {new Date(announcement.starts_at).toLocaleString()}
                {announcement.ends_at ? ` → ${new Date(announcement.ends_at).toLocaleString()}` : " → no end date"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleActive(announcement)}
              className={`shrink-0 rounded-pill px-4 py-1.5 text-xs font-semibold ${
                announcement.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
              }`}
            >
              {announcement.active ? "Active" : "Inactive"}
            </button>
            <button
              type="button"
              onClick={() => remove(announcement.id)}
              className="shrink-0 font-body text-small font-medium text-ink/50 hover:text-berry"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddAnnouncementForm({ onAdded }: { onAdded: (announcement: Announcement) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please add a title.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `broadcast-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("announcement-images")
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("announcement-images").getPublicUrl(path).data.publicUrl;
      }
      const { data: created, error: insertError } = await supabase
        .from("announcements")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          image_url: imageUrl,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        })
        .select("id, title, description, image_url, active, starts_at, ends_at")
        .single<Announcement>();
      if (insertError) throw insertError;
      onAdded(created);
      setTitle("");
      setDescription("");
      setEndsAt("");
      setImageFile(null);
    } catch {
      setError("Could not create this broadcast. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-3">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={inputClasses} />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Description"
        className={`${inputClasses} resize-none`}
      />
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Image (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="mt-1 font-body text-small text-ink"
        />
      </div>
      <div>
        <label className="font-body text-xs font-medium uppercase tracking-wide text-ink/50">
          Show until (leave blank to run indefinitely)
        </label>
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className={`${inputClasses} mt-1`}
        />
      </div>
      {error && <p className="font-body text-small text-berry">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="self-start rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
      >
        {saving ? "Publishing..." : "Publish broadcast"}
      </button>
    </form>
  );
}
