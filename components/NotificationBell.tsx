"use client";

import { Bell } from "lucide-react";
import { useUnreadMessageCount } from "@/lib/supabase/messages";

export default function NotificationBell({ role }: { role: "customer" | "admin" }) {
  const { count } = useUnreadMessageCount(role);

  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-plaster/40 text-ink/70">
      <Bell className="size-5" strokeWidth={1.75} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-berry text-[10px] font-semibold text-cream">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}
