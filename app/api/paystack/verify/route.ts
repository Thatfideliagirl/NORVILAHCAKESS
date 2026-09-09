import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Never trust the client's word that a card payment succeeded: the
// Paystack popup running in the browser could be tampered with, so the
// order is only marked paid after this server-side call confirms the
// transaction with Paystack directly (using the secret key, never
// exposed to the browser) and the paid amount matches the order total.
export async function POST(request: NextRequest) {
  const { reference, orderId } = await request.json();
  if (!reference || !orderId) {
    return NextResponse.json({ error: "Missing reference or orderId." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Payment verification is not configured yet." }, { status: 500 });
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  const verifyData = await verifyRes.json();

  if (!verifyRes.ok || verifyData?.data?.status !== "success") {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { error: "Payment verified but the order couldn't be updated. Contact support." },
      { status: 500 }
    );
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, total_naira, payment_status")
    .eq("id", orderId)
    .single();
  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const paidNaira = verifyData.data.amount / 100;
  if (paidNaira !== order.total_naira) {
    return NextResponse.json({ error: "Amount paid doesn't match the order total." }, { status: 400 });
  }

  if (order.payment_status !== "paid") {
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", orderId);
    if (updateError) {
      return NextResponse.json({ error: "Payment verified but the order couldn't be updated." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
