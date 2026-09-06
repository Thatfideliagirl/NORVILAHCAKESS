"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  created_at: string;
};

function toCsv(customers: Customer[]): string {
  const header = "Name,Email,Phone,Location,Joined\n";
  const rows = customers
    .map((c) =>
      [c.full_name ?? "", c.email ?? "", c.phone ?? "", c.location ?? "", c.created_at]
        .map((field) => `"${String(field).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  return header + rows;
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startingChatFor, setStartingChatFor] = useState<string | null>(null);

  async function startChat(customerId: string) {
    setStartingChatFor(customerId);
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("customer_id", customerId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let conversationId = existing?.id;
    if (!conversationId) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ customer_id: customerId })
        .select("id")
        .single();
      conversationId = created?.id;
    }
    setStartingChatFor(null);
    if (conversationId) router.push(`/admin/messages?open=${conversationId}`);
  }

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, location, created_at")
      .eq("role", "customer")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setLoadError(error.message);
        setCustomers(data ?? []);
      });
  }, []);

  function exportCsv() {
    const blob = new Blob([toCsv(customers)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "norvilah-customers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-display text-heading text-berry">Customers</p>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-pill border border-clay px-5 py-2 font-body text-small font-medium text-ink"
        >
          Export CSV
        </button>
      </div>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[560px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/50">
                  No customers yet.
                </td>
              </tr>
            )}
            {customers.map((customer) => (
              <tr key={customer.id} className="border-b border-clay/10 last:border-none">
                <td className="px-4 py-3 text-ink">{customer.full_name ?? "-"}</td>
                <td className="px-4 py-3 text-ink/70">{customer.email}</td>
                <td className="px-4 py-3 text-ink/70">{customer.phone ?? "-"}</td>
                <td className="px-4 py-3 text-ink/70">{customer.location ?? "-"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => startChat(customer.id)}
                    disabled={startingChatFor === customer.id}
                    aria-label={`Chat with ${customer.full_name ?? "customer"}`}
                    className="flex size-8 items-center justify-center rounded-full bg-berry/10 text-berry transition-colors hover:bg-berry/20 disabled:opacity-60"
                  >
                    <MessageCircle className="size-4" strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
