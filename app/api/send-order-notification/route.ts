import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/resend";

// Replaces the old EmailJS "new order" admin alert -- same trigger
// points in checkout, just sent via Resend so the wording is editable
// from Admin -> Emails like the customer-facing ones.
export async function POST(request: NextRequest) {
  const {
    adminEmail,
    orderNumber,
    customerName,
    customerPhone,
    orderItems,
    orderTotal,
    deliveryLocation,
    orderChannel,
    paymentMethod,
  } = await request.json();
  if (!adminEmail) {
    return NextResponse.json({ error: "Missing admin notification email." }, { status: 400 });
  }
  const result = await sendTemplateEmail("admin_new_order", adminEmail, {
    order_number: orderNumber || "",
    customer_name: customerName || "",
    customer_phone: customerPhone || "",
    order_items: orderItems || "",
    order_total: orderTotal || "",
    delivery_location: deliveryLocation || "",
    order_channel: orderChannel || "",
    payment_method: paymentMethod || "",
  });
  return NextResponse.json(result);
}
