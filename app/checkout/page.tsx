"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart";
import { formatNaira } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { useStorefrontProducts } from "@/lib/supabase/storefront-products";

type DeliveryZone = {
  id: string;
  name: string;
  fee_naira: number;
};

type Channels = {
  website: boolean;
  whatsapp: boolean;
};

type BankDetails = {
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
};

function generateOrderNumber(): string {
  return `NV${Date.now().toString().slice(-8)}`;
}

function buildOrderMessage(
  items: ReturnType<typeof useCartStore.getState>["items"],
  zoneName: string | null,
  fee: number,
  total: number,
  name: string,
  address: string,
  phone: string,
  additionalInfo: string,
  orderNumber: string
): string {
  const lines = [`Hi Norvilah, I would like to place order ${orderNumber}:`, ""];
  for (const item of items) {
    const variant = item.variantLabel ? ` (${item.variantLabel})` : "";
    lines.push(`${item.quantity} x ${item.name}${variant} — ${formatNaira(item.priceNaira * item.quantity)}`);
  }
  lines.push("");
  if (name.trim()) lines.push(`Name: ${name}`);
  if (zoneName) lines.push(`Delivery to: ${zoneName} (${formatNaira(fee)})`);
  if (address.trim()) lines.push(`Address: ${address}`);
  if (phone.trim()) lines.push(`Phone: ${phone}`);
  if (additionalInfo.trim()) lines.push(`Additional info: ${additionalInfo}`);
  lines.push(`Total: ${formatNaira(total)}`);
  lines.push("", "I've made my bank transfer and will share the receipt here.");
  return lines.join("\n");
}

const inputClasses =
  "w-full rounded-panel border border-clay/25 bg-cream px-4 py-3 font-body text-body text-ink placeholder:text-ink/40 focus-visible:border-berry";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const products = useStorefrontProducts();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [channels, setChannels] = useState<Channels>({ website: true, whatsapp: true });
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: null,
    accountName: null,
    accountNumber: null,
  });
  const [name, setName] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [channel, setChannel] = useState<"website" | "whatsapp">("whatsapp");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ orderNumber: string; total: number } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase
      .from("delivery_locations")
      .select("id, name, fee_naira")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setZones(data ?? []));
    supabase
      .from("settings")
      .select("website_ordering_enabled, whatsapp_ordering_enabled, bank_name, bank_account_name, bank_account_number")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setChannels({ website: data.website_ordering_enabled, whatsapp: data.whatsapp_ordering_enabled });
          if (!data.whatsapp_ordering_enabled) setChannel("website");
          setBankDetails({
            bankName: data.bank_name,
            accountName: data.bank_account_name,
            accountNumber: data.bank_account_number,
          });
        }
      });
  }, []);

  const subtotal = items.reduce((sum, item) => sum + item.priceNaira * item.quantity, 0);
  const selectedZone = zones.find((z) => z.id === zoneId);
  const fee = selectedZone?.fee_naira ?? 0;
  const total = subtotal + fee;

  async function insertOrderItems(orderId: string) {
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const localProduct = products.find((p) => p.id === item.productId);
        const { data: dbProduct } = localProduct
          ? await supabase.from("products").select("id").eq("slug", localProduct.slug).single()
          : { data: null };
        return {
          order_id: orderId,
          product_id: dbProduct?.id ?? null,
          product_name: item.name,
          variant_label: item.variantLabel ?? null,
          unit_price_naira: item.priceNaira,
          quantity: item.quantity,
          line_total_naira: item.priceNaira * item.quantity,
        };
      })
    );
    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) throw itemsError;
  }

  async function onWhatsAppOrder(customerId: string) {
    if (!selectedZone) {
      setError("Please choose a delivery location.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const orderNumber = generateOrderNumber();
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          channel: "whatsapp",
          delivery_location_id: selectedZone.id,
          delivery_address: address,
          customer_name: name,
          notes: additionalInfo || null,
          subtotal_naira: subtotal,
          delivery_fee_naira: fee,
          total_naira: total,
          payment_status: "awaiting_confirmation",
        })
        .select("id")
        .single();
      if (orderError) throw orderError;

      await insertOrderItems(order.id);

      const message = buildOrderMessage(
        items,
        selectedZone.name,
        fee,
        total,
        name,
        address,
        phone,
        additionalInfo,
        orderNumber
      );
      window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");

      clearCart();
      setConfirmedOrder({ orderNumber, total });
    } catch {
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onWebsiteOrder(customerId: string) {
    if (!receiptFile) {
      setError("Please upload your payment receipt.");
      return;
    }
    if (!selectedZone) {
      setError("Please choose a delivery location.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const orderNumber = generateOrderNumber();
      const ext = receiptFile.name.split(".").pop();
      const path = `${customerId}/${orderNumber}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(path, receiptFile);
      if (uploadError) throw uploadError;

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          channel: "website",
          delivery_location_id: selectedZone.id,
          delivery_address: address,
          customer_name: name,
          notes: additionalInfo || null,
          subtotal_naira: subtotal,
          delivery_fee_naira: fee,
          total_naira: total,
          payment_status: "awaiting_confirmation",
          receipt_url: path,
        })
        .select("id")
        .single();
      if (orderError) throw orderError;

      await insertOrderItems(order.id);

      clearCart();
      setConfirmedOrder({ orderNumber, total });
    } catch {
      setError("Something went wrong placing your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setError("Please create an account or log in to place an order.");
      return;
    }
    if (channel === "whatsapp") await onWhatsAppOrder(session.user.id);
    else await onWebsiteOrder(session.user.id);
  }

  if (confirmedOrder) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 pt-24 text-center">
        <div className="max-w-sm">
          <p className="font-display text-heading text-berry">Order placed!</p>
          <p className="mt-4 font-body text-body text-ink/70">
            Your order number is <strong>{confirmedOrder.orderNumber}</strong>. We&apos;ll confirm
            your payment and get started once it&apos;s reviewed.
          </p>
          <p className="mt-2 font-display text-product text-ink">
            Total: <span className="text-berry">{formatNaira(confirmedOrder.total)}</span>
          </p>
          <Link
            href="/account"
            className="mt-8 inline-block rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream"
          >
            View My Orders
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-6 pt-24 text-center">
        <p className="font-display text-heading text-berry">Your cart is empty.</p>
        <Link
          href="/menu"
          className="rounded-pill bg-cocoa px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-ink"
        >
          Browse the Menu
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-6 pb-24 pt-32 lg:px-11">
      <div className="mx-auto grid max-w-content gap-12 md:grid-cols-2">
        <div>
          <h1 className="font-display text-heading text-berry">Checkout</h1>
          <div className="mt-6 divide-y divide-clay/15">
            {items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div key={`${item.productId}-${item.variantId ?? "base"}`} className="flex items-center gap-3 py-4">
                  {product && (
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-panel">
                      <Image src={product.image} alt={item.name} fill sizes="56px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-body text-ink">
                      {item.quantity} x {item.name}
                      {item.variantLabel ? ` (${item.variantLabel})` : ""}
                    </p>
                  </div>
                  <p className="font-body text-small font-semibold text-berry">
                    {formatNaira(item.priceNaira * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex flex-col gap-2 border-t border-clay/15 pt-6 font-body text-body text-ink">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatNaira(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{selectedZone ? formatNaira(fee) : "-"}</span>
            </div>
            <div className="flex justify-between font-display text-product text-ink">
              <span>Total</span>
              <span className="text-berry">{formatNaira(total)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {!session && (
            <p className="rounded-panel bg-berry/10 px-4 py-3 font-body text-small text-berry">
              <Link href="/account" className="underline">
                Create an account or log in
              </Link>{" "}
              to place an order — this applies whether you check out on the website or via WhatsApp.
            </p>
          )}
          <input
            required
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
          />
          <input
            required
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClasses}
          />
          <textarea
            required
            rows={2}
            placeholder="Delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`${inputClasses} resize-none`}
          />
          <select
            required
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className={inputClasses}
          >
            <option value="" disabled>
              Choose your delivery location
            </option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name} — {formatNaira(zone.fee_naira)}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            placeholder="Additional information / special delivery details (optional)"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            className={`${inputClasses} resize-none`}
          />

          {channels.website && channels.whatsapp && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChannel("website")}
                className={`flex-1 rounded-pill border px-4 py-2.5 font-body text-small font-medium ${
                  channel === "website" ? "border-berry bg-berry text-cream" : "border-clay/30 text-ink/70"
                }`}
              >
                Order via Website
              </button>
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`flex-1 rounded-pill border px-4 py-2.5 font-body text-small font-medium ${
                  channel === "whatsapp" ? "border-berry bg-berry text-cream" : "border-clay/30 text-ink/70"
                }`}
              >
                Order via WhatsApp
              </button>
            </div>
          )}

          {channel === "website" && (
            <div>
              <label className="font-body text-small font-medium text-ink/70">
                Upload your payment receipt (image or PDF)
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full font-body text-small text-ink"
              />
            </div>
          )}

          {channel === "whatsapp" && (
            <div className="rounded-panel bg-plaster/30 p-4">
              <p className="font-body text-small font-medium text-ink/70">
                Transfer to this account, then finish your order on WhatsApp:
              </p>
              {bankDetails.accountNumber ? (
                <div className="mt-2 font-body text-small text-ink">
                  <p>Bank: {bankDetails.bankName}</p>
                  <p>Account name: {bankDetails.accountName}</p>
                  <p className="font-semibold text-berry">Account number: {bankDetails.accountNumber}</p>
                </div>
              ) : (
                <p className="mt-2 font-body text-small text-ink/60">
                  Bank details will be shared with you on WhatsApp.
                </p>
              )}
            </div>
          )}

          {error && <p className="font-body text-small text-berry">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !session}
            className="mt-2 rounded-pill bg-berry px-8 py-3.5 font-body font-medium text-cream transition-colors duration-200 hover:bg-cocoa disabled:opacity-60"
          >
            {submitting
              ? "Placing order..."
              : channel === "whatsapp"
                ? "Continue on WhatsApp"
                : "Place Order"}
          </button>
        </form>
      </div>
    </main>
  );
}
