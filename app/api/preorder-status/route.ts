import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { currentPreorderCycle } from "@/lib/preorder";

// Runs with the service-role key because working out how many slots
// are taken means counting orders across *every* customer, not just
// the visitor's own -- something the public anon key can't do (orders
// are locked to their owner or an admin). Only ever returns aggregate
// numbers, never any customer's order details.
export async function GET() {
  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch {
    return NextResponse.json({ error: "Pre-order status is not configured." }, { status: 500 });
  }

  const { data: preorders, error: preorderError } = await supabaseAdmin
    .from("product_preorders")
    .select("product_id, slots, starts_at, ends_at, recurring");
  if (preorderError) {
    return NextResponse.json({ error: preorderError.message }, { status: 500 });
  }
  if (!preorders || preorders.length === 0) {
    return NextResponse.json({});
  }

  const productIds = preorders.map((p) => p.product_id);
  const { data: itemRows, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("product_id, quantity, orders!inner(created_at, status)")
    .in("product_id", productIds);
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  type ItemRow = {
    product_id: string;
    quantity: number;
    orders: { created_at: string; status: string } | { created_at: string; status: string }[] | null;
  };

  const result: Record<
    string,
    {
      slotsTotal: number;
      slotsTaken: number;
      cycleStart: string;
      cycleEnd: string;
      recurring: boolean;
      hasStarted: boolean;
      hasEnded: boolean;
    }
  > = {};

  for (const pre of preorders) {
    const cycle = currentPreorderCycle(pre.starts_at, pre.ends_at, pre.recurring);
    const slotsTaken = ((itemRows as ItemRow[] | null) ?? []).reduce((sum, row) => {
      if (row.product_id !== pre.product_id) return sum;
      const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
      if (!order || order.status === "cancelled") return sum;
      const orderDate = order.created_at.slice(0, 10);
      if (orderDate < cycle.cycleStart || orderDate > cycle.cycleEnd) return sum;
      return sum + row.quantity;
    }, 0);

    result[pre.product_id] = {
      slotsTotal: pre.slots,
      slotsTaken,
      cycleStart: cycle.cycleStart,
      cycleEnd: cycle.cycleEnd,
      recurring: pre.recurring,
      hasStarted: cycle.hasStarted,
      hasEnded: cycle.hasEnded,
    };
  }

  return NextResponse.json(result);
}
