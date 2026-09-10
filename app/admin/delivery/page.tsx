"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatNaira } from "@/lib/format";
import AdminErrorBanner from "@/components/admin/AdminErrorBanner";

type Zone = {
  id: string;
  name: string;
  fee_naira: number;
  active: boolean;
};

export default function AdminDeliveryPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [name, setName] = useState("");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  function fetchZones() {
    return supabase.from("delivery_locations").select("id, name, fee_naira, active").order("sort_order");
  }

  useEffect(() => {
    fetchZones().then(({ data, error }) => {
      if (error) setLoadError(error.message);
      setZones(data ?? []);
    });
  }, []);

  async function addZone(e: React.FormEvent) {
    e.preventDefault();
    const feeValue = Number(fee);
    if (!name.trim() || !Number.isFinite(feeValue)) return;
    setSaving(true);
    await supabase.from("delivery_locations").insert({ name: name.trim(), fee_naira: feeValue });
    setName("");
    setFee("");
    setSaving(false);
    fetchZones().then(({ data }) => setZones(data ?? []));
  }

  async function toggleActive(zone: Zone) {
    setZones((current) => current.map((z) => (z.id === zone.id ? { ...z, active: !z.active } : z)));
    await supabase.from("delivery_locations").update({ active: !zone.active }).eq("id", zone.id);
  }

  return (
    <div>
      <p className="font-display text-heading text-berry">Delivery</p>
      <p className="mt-2 font-body text-body text-ink/60">
        Add new delivery zones and set the fee for each.
      </p>

      <form onSubmit={addZone} className="mt-6 flex flex-col gap-3 sm:max-w-lg sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Zone name (e.g. Ikeja)"
          className="flex-1 rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink"
        />
        <input
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          placeholder="Fee (₦)"
          inputMode="numeric"
          className="rounded-panel border border-clay/25 bg-cream px-4 py-2.5 font-body text-body text-ink sm:w-32"
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-pill bg-cocoa px-6 py-2.5 font-body text-small font-medium text-cream disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {loadError && <AdminErrorBanner message={loadError} />}

      <div className="mt-8 overflow-x-auto rounded-panel bg-cream shadow-warm">
        <table className="w-full min-w-[420px] text-left font-body text-small">
          <thead>
            <tr className="border-b border-clay/15 text-ink/50">
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Fee</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id} className="border-b border-clay/10 last:border-none">
                <td className="px-4 py-3 text-ink">{zone.name}</td>
                <td className="px-4 py-3 font-medium text-berry">{formatNaira(zone.fee_naira)}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(zone)}
                    className={`rounded-pill px-4 py-1.5 text-xs font-semibold ${
                      zone.active ? "bg-berry/15 text-berry" : "bg-clay/15 text-ink/50"
                    }`}
                  >
                    {zone.active ? "Active" : "Inactive"}
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
