"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifications } from "@/lib/supabase/messages";

export default function NotificationBell({
  role,
  onSelectMessage,
}: {
  role: "customer" | "admin";
  onSelectMessage?: () => void;
}) {
  const { items, count } = useNotifications(role);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
        className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-plaster/40 text-ink/70"
      >
        <Bell className="size-5" strokeWidth={1.75} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-berry text-[10px] font-semibold text-cream">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-72 rounded-panel bg-cream p-2 shadow-warm-lg">
            {items.length === 0 && (
              <p className="p-4 text-center font-body text-small text-ink/50">No new notifications.</p>
            )}
            {items.map((item) =>
              item.kind === "message" && role === "customer" ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onSelectMessage?.();
                  }}
                  className="block w-full rounded-panel px-3 py-2 text-left transition-colors hover:bg-plaster/30"
                >
                  <NotificationContent title={item.title} body={item.body} />
                </button>
              ) : (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-panel px-3 py-2 transition-colors hover:bg-plaster/30"
                >
                  <NotificationContent title={item.title} body={item.body} />
                </Link>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NotificationContent({ title, body }: { title: string; body: string }) {
  return (
    <>
      <p className="font-body text-small font-medium text-ink">{title}</p>
      <p className="mt-0.5 truncate font-body text-xs text-ink/60">{body}</p>
    </>
  );
}
