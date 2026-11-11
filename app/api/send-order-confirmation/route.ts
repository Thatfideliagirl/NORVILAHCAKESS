import { NextRequest, NextResponse } from "next/server";
import { sendTemplateEmail } from "@/lib/resend";

// Fire-and-forget from checkout, after the order has already been
// created -- never blocks or fails an order placement. Pickup orders
// get a different template (pickup location/phone instead of a
// delivery zone) since there's nothing to deliver.
export async function POST(request: NextRequest) {
  const {
    name,
    email,
    orderNumber,
    orderItems,
    orderTotal,
    deliveryLocation,
    fulfillmentType,
    pickupLocation,
    pickupPhone,
    pickupMessage,
  } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Missing email." }, { status: 400 });
  }
  const result =
    fulfillmentType === "pickup"
      ? await sendTemplateEmail("order_confirmation_pickup", email, {
          name: name || "there",
          order_number: orderNumber || "",
          order_items: orderItems || "",
          order_total: orderTotal || "",
          pickup_location: pickupLocation || "",
          pickup_phone: pickupPhone || "",
          pickup_message: pickupMessage || "",
        })
      : await sendTemplateEmail("order_confirmation", email, {
          name: name || "there",
          order_number: orderNumber || "",
          order_items: orderItems || "",
          order_total: orderTotal || "",
          delivery_location: deliveryLocation || "",
        });
  return NextResponse.json(result);
}
