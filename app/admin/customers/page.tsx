"use client";

import { useEffect, useState } from "react";
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

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
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/50">
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
