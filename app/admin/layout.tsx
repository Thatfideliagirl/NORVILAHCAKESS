"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAdminSession } from "@/lib/supabase/use-admin-session";
import Avatar from "@/components/Avatar";
import NotificationBell from "@/components/NotificationBell";

const NAV_GROUPS = [
  {
    label: "Main",
    links: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/messages", label: "Messages" },
    ],
  },
  {
    label: "Content",
    links: [
      { href: "/admin/faqs", label: "FAQs" },
      { href: "/admin/inquiries", label: "Events & Inquiries" },
      { href: "/admin/announcements", label: "Broadcasts" },
    ],
  },
  {
    label: "Business",
    links: [
      { href: "/admin/delivery", label: "Delivery" },
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/profile", label: "Profile" },
    ],
  },
];

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-8">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="px-3 font-body text-eyebrow font-semibold uppercase tracking-[0.12em] text-ink/50">
            {group.label}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {group.links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onNavigate}
                  className={`rounded-panel px-3 py-2 font-body text-small font-medium transition-colors ${
                    active ? "bg-berry text-cream" : "text-ink/80 hover:bg-plaster/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, profile } = useAdminSession();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream pt-24">
        <p className="font-body text-body text-ink/60">Loading...</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
        <div>
          <p className="font-display text-heading text-berry">Log in required</p>
          <Link
            href="/account"
            className="mt-6 inline-block rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream"
          >
            Go to log in
          </Link>
        </div>
      </main>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
        <p className="font-display text-heading text-berry">
          This account doesn&apos;t have admin access.
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream pt-16">
      <div className="fixed inset-x-0 top-16 z-30 flex items-center justify-between border-b border-clay/15 bg-plaster/20 px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open admin menu"
          className="flex size-9 items-center justify-center text-ink"
        >
          <Menu className="size-5" strokeWidth={1.75} />
        </button>
        <Link href="/admin/profile" className="flex items-center gap-2">
          <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={32} />
          <p className="font-body text-small font-semibold text-ink">{profile?.full_name || "Admin"}</p>
        </Link>
        <NotificationBell role="admin" align="right" />
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-cocoa/40 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-plaster/95 px-4 py-6 shadow-warm-lg md:hidden"
            >
              <div className="mb-6 flex items-center justify-between gap-2 px-1">
                <Link href="/admin/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3">
                  <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={40} />
                  <div>
                    <p className="font-body text-small font-semibold text-ink">
                      {profile?.full_name || "Admin"}
                    </p>
                    <p className="font-body text-xs text-ink/50">Super Admin</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex size-9 items-center justify-center text-ink"
                >
                  <X className="size-5" strokeWidth={1.75} />
                </button>
              </div>
              <SidebarNav pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className="mt-8 flex w-full items-center gap-2 rounded-panel px-3 py-2 font-body text-small font-medium text-ink/70 transition-colors hover:bg-plaster/60"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
                Sign out
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside className="hidden w-60 shrink-0 border-r border-clay/15 bg-plaster/20 px-4 py-8 md:block">
        <div className="mb-6 flex items-center justify-between gap-2 px-3">
          <Link href="/admin/profile" className="flex items-center gap-3">
            <Avatar url={profile?.avatar_url ?? null} name={profile?.full_name ?? null} size={40} />
            <div>
              <p className="font-body text-small font-semibold text-ink">
                {profile?.full_name || "Admin"}
              </p>
              <p className="font-body text-xs text-ink/50">Super Admin</p>
            </div>
          </Link>
          <NotificationBell role="admin" align="left" />
        </div>
        <SidebarNav pathname={pathname} />
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-8 flex w-full items-center gap-2 rounded-panel px-3 py-2 font-body text-small font-medium text-ink/70 transition-colors hover:bg-plaster/60"
        >
          <LogOut className="size-4" strokeWidth={1.75} />
          Sign out
        </button>
      </aside>
      <div className="min-w-0 flex-1 px-6 py-8 pt-20 md:px-10 md:py-10 md:pt-10">{children}</div>
    </div>
  );
}
