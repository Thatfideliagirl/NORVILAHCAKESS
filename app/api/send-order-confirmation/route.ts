import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/resend";

// Fire-and-forget from checkout, after the order has already been
// created -- never blocks or fails an order placement.
export async function POST(request: NextRequest) {
  const { name, email, orderNumber, orderItems, orderTotal, deliveryLocation } =
    await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }
  const result = await sendTemplateEmail("order_confirmation", email, {
    name: name || "there",
    order_number: orderNumber || "",
    order_items: orderItems || "",
    order_total: orderTotal || "",
    delivery_location: deliveryLocation || "",
  });
  return NextResponse.json(result);
}
