"use server";

import { revalidatePath } from "next/cache";
import { canConfirmPayment, getAuthProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function reviewPayment(orderId: string, receiptId: string, decision: "confirmed" | "rejected") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Sign in before reviewing payments.");
  }

  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) {
    throw new Error("Your account profile is incomplete. Please contact support.");
  }

  const { data: order } = await supabase.from("orders").select("branch_id").eq("id", orderId).maybeSingle();
  if (!canConfirmPayment(profile, order?.branch_id ?? null)) {
    throw new Error("You can only review payment receipts for your assigned branch.");
  }

  const orderStatus = decision === "confirmed" ? "paid_approved" : "payment_rejected";
  const reviewNote =
    decision === "confirmed"
      ? "Payment confirmed. Order status updated to paid approved."
      : "Receipt rejected. Customer should upload a clearer or matching receipt.";

  const { error: receiptError } = await supabase
    .from("payment_receipts")
    .update({
      status: decision,
      reviewed_by: user.id,
      review_note: reviewNote,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", receiptId);

  if (receiptError) {
    throw new Error(receiptError.message);
  }

  const { error: orderError } = await supabase
    .from("orders")
    .update({ status: orderStatus })
    .eq("id", orderId);

  if (orderError) {
    throw new Error(orderError.message);
  }

  revalidatePath("/cashier");
  revalidatePath("/orders");
  revalidatePath("/admin");
  revalidatePath("/manager");
  revalidatePath("/vendor");
}
