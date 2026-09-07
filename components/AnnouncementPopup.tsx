"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";

type Announcement = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
};

function dismissedKey(id: string): string {
  return `norvilah-announcement-dismissed-${id}`;
}

export default function AnnouncementPopup() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from("announcements")
      .select("id, title, description, image_url")
      .eq("active", true)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        try {
          if (localStorage.getItem(dismissedKey(data.id))) return;
        } catch {
          // localStorage unavailable -- show it anyway
        }
        setAnnouncement(data);
      });
  }, []);

  function dismiss() {
    if (announcement) {
      try {
        localStorage.setItem(dismissedKey(announcement.id), "1");
      } catch {
        // ignore
      }
    }
    setAnnouncement(null);
  }

  if (pathname?.startsWith("/admin")) return null;

  return (
    <AnimatePresence>
      {announcement && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-cocoa/50"
            onClick={dismiss}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={announcement.title}
              className="relative w-full max-w-sm overflow-hidden rounded-panel bg-cream shadow-warm-lg"
            >
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-cream/90 text-ink shadow-warm"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
              {announcement.image_url && (
                <div className="relative h-40 w-full">
                  <Image
                    src={announcement.image_url}
                    alt={announcement.title}
                    fill
                    sizes="384px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <p className="font-display text-product text-berry">{announcement.title}</p>
                {announcement.description && (
                  <p className="mt-2 font-body text-small text-ink/70">{announcement.description}</p>
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  className="mt-5 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
