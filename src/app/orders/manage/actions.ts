"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canConfirmPayment, getAuthProfile, isAdmin, isCustomer, isManager, isSafeRedirect } from "@/lib/auth";
import { paymentDecisionEmail, sendMarketplaceEmail } from "@/lib/email";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import type { OrderStatus } from "@/lib/types";

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

function returnPath(formData: FormData) {
  const value = String(formData.get("return_to") ?? "/orders");
  return isSafeRedirect(value) ? value : "/orders";
}

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/orders");
  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) redirect("/login?error=Your%20account%20profile%20is%20incomplete.%20Please%20contact%20support.");
  return { supabase, user, profile };
}

async function getOrderForAction(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string) {
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, profile_id, branch_id, status, total, customer_email")
    .eq("id", orderId)
    .maybeSingle();
  return data as { id: string; order_number: string; profile_id: string | null; branch_id: string; status: OrderStatus; total: number | string; customer_email: string | null } | null;
}

async function logOrderEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  profileId: string,
  eventType: string,
  note?: string,
) {
  await supabase.from("order_events").insert({
    order_id: orderId,
    profile_id: profileId,
    event_type: eventType,
    note: note || null,
  });
}

async function notify(supabase: Awaited<ReturnType<typeof createClient>>, profileId: string | null | undefined, message: string) {
  if (!profileId) return;
  await supabase.from("notifications").insert({
    profile_id: profileId,
    channel: "dashboard",
    recipient: profileId,
    message,
    status: "queued",
  });
}

async function notifyVendorsForOrder(supabase: Awaited<ReturnType<typeof createClient>>, orderId: string, message: string) {
  const { data } = await supabase
    .from("order_items")
    .select("vendors(profile_id)")
    .eq("order_id", orderId);
  const profileIds = new Set(
    (data ?? [])
      .map((item) => {
        const vendor = Array.isArray(item.vendors) ? item.vendors[0] : item.vendors;
        return vendor?.profile_id as string | undefined;
      })
      .filter(Boolean),
  );

  for (const profileId of profileIds) {
    await notify(supabase, profileId, message);
  }
}

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/admin/orders");
  revalidatePath("/manager/orders");
  revalidatePath("/cashier/orders");
  revalidatePath("/vendor/orders");
  revalidatePath("/admin");
  revalidatePath("/manager");
  revalidatePath("/cashier");
  revalidatePath("/vendor");
}

export async function updateManagedOrderStatus(formData: FormData) {
  const back = returnPath(formData);
  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();
  const { supabase, user, profile } = await requireProfile();
  const order = await getOrderForAction(supabase, orderId);
  if (!order) redirect(`${back}?error=Order%20not%20found.`);

  const managerStatuses: OrderStatus[] = ["processing", "ready_for_pickup", "fulfilled"];
  const adminStatuses: OrderStatus[] = ["awaiting_receipt", "receipt_uploaded", "paid_approved", "payment_rejected", "processing", "ready_for_pickup", "fulfilled", "cancelled"];
  const allowed =
    (isAdmin(profile) && adminStatuses.includes(status)) ||
    (isManager(profile) && profile.branch_id === order.branch_id && managerStatuses.includes(status));

  if (!allowed) redirect(`${back}?error=You%20cannot%20change%20that%20order%20status.`);

  await supabase.from("orders").update({ status, support_note: note || null }).eq("id", orderId);
  await logOrderEvent(supabase, orderId, user.id, status, note);
  await notify(supabase, order.profile_id, `Order ${order.order_number} status updated to ${status.replaceAll("_", " ")}.`);
  await writeAuditLog(supabase, {
    actorId: user.id,
    actorRole: profile.role,
    action: "order_status_changed",
    entityType: "order",
    entityId: orderId,
    branchId: order.branch_id,
    metadata: { status, orderNumber: order.order_number },
  });
  revalidateOrders();
  redirect(`${back}?success=Order%20status%20updated.`);
}

export async function assignOrderBranch(formData: FormData) {
  const back = returnPath(formData);
  const orderId = String(formData.get("order_id") ?? "");
  const branchId = String(formData.get("branch_id") ?? "");
  const managerId = String(formData.get("manager_id") ?? "") || null;
  const { supabase, user, profile } = await requireProfile();
  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20assign%20orders.`);

  await supabase.from("orders").update({ branch_id: branchId, assigned_manager_id: managerId }).eq("id", orderId);
  await logOrderEvent(supabase, orderId, user.id, "branch_assigned", "Branch or manager assignment updated.");
  await writeAuditLog(supabase, {
    actorId: user.id,
    actorRole: profile.role,
    action: "order_branch_assigned",
    entityType: "order",
    entityId: orderId,
    branchId,
  });
  revalidateOrders();
  redirect(`${back}?success=Order%20assignment%20updated.`);
}

export async function reviewManagedPayment(formData: FormData) {
  const back = returnPath(formData);
  const orderId = String(formData.get("order_id") ?? "");
  const receiptId = String(formData.get("receipt_id") ?? "");
  const decision = String(formData.get("decision") ?? "") as "confirmed" | "rejected";
  const note = String(formData.get("note") ?? "").trim();
  const { supabase, user, profile } = await requireProfile();
  const order = await getOrderForAction(supabase, orderId);
  if (!order || !canConfirmPayment(profile, order.branch_id)) redirect(`${back}?error=You%20cannot%20review%20that%20receipt.`);

  const orderStatus: OrderStatus = decision === "confirmed" ? "paid_approved" : "payment_rejected";
  const receiptStatus = decision === "confirmed" ? "confirmed" : "rejected";
  const reviewNote = note || (decision === "confirmed" ? "Payment confirmed." : "Payment rejected.");

  await supabase.from("payment_receipts").update({
    status: receiptStatus,
    reviewed_by: user.id,
    review_note: reviewNote,
    reviewed_at: new Date().toISOString(),
  }).eq("id", receiptId);
  await supabase.from("orders").update({ status: orderStatus, cashier_note: reviewNote }).eq("id", orderId);
  await logOrderEvent(supabase, orderId, user.id, orderStatus, reviewNote);
  await notify(supabase, order.profile_id, `Payment ${decision} for order ${order.order_number}.`);
  if (order.customer_email) {
    const email = paymentDecisionEmail(order.order_number, decision, reviewNote);
    await sendMarketplaceEmail({
      to: order.customer_email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }
  if (decision === "confirmed") {
    await notifyVendorsForOrder(supabase, orderId, `New paid order ${order.order_number} is ready for vendor processing.`);
  }
  await writeAuditLog(supabase, {
    actorId: user.id,
    actorRole: profile.role,
    action: decision === "confirmed" ? "payment_confirmed" : "payment_rejected",
    entityType: "order",
    entityId: orderId,
    branchId: order.branch_id,
    metadata: { orderNumber: order.order_number, receiptId },
  });
  revalidateOrders();
  redirect(`${back}?success=Payment%20review%20saved.`);
}

export async function cancelManagedOrder(formData: FormData) {
  const back = returnPath(formData);
  const orderId = String(formData.get("order_id") ?? "");
  const { supabase, user, profile } = await requireProfile();
  const order = await getOrderForAction(supabase, orderId);
  if (!order) redirect(`${back}?error=Order%20not%20found.`);
  const allowed = isAdmin(profile) || (isCustomer(profile) && order.profile_id === profile.id && ["awaiting_receipt", "receipt_uploaded", "payment_rejected"].includes(order.status));
  if (!allowed) redirect(`${back}?error=This%20order%20cannot%20be%20cancelled.`);

  await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
  await logOrderEvent(supabase, orderId, user.id, "cancelled", "Order cancelled.");
  revalidateOrders();
  redirect(`${back}?success=Order%20cancelled.`);
}

export async function reuploadOrderReceipt(formData: FormData) {
  const back = returnPath(formData);
  const orderId = String(formData.get("order_id") ?? "");
  const receipt = formData.get("receipt");
  const { supabase, user, profile } = await requireProfile();
  const order = await getOrderForAction(supabase, orderId);
  if (!order || order.profile_id !== profile.id) redirect(`${back}?error=You%20cannot%20upload%20for%20that%20order.`);
  if (!(receipt instanceof File) || receipt.size === 0) redirect(`${back}?error=Choose%20a%20receipt%20file.`);

  const receiptPath = `${user.id}/${order.id}/${Date.now()}-${cleanFileName(receipt.name || "receipt")}`;
  const { error: uploadError } = await supabase.storage.from(supabaseConfig.storageBuckets.paymentReceipts).upload(receiptPath, receipt, {
    contentType: receipt.type || "application/octet-stream",
    upsert: false,
  });
  if (uploadError) redirect(`${back}?error=Could%20not%20upload%20receipt.`);

  await supabase.from("payment_receipts").insert({
    order_id: order.id,
    uploaded_by: user.id,
    storage_path: receiptPath,
    amount: order.total,
    status: "pending",
  });
  await supabase.from("orders").update({ status: "receipt_uploaded", cashier_note: null }).eq("id", order.id);
  await logOrderEvent(supabase, order.id, user.id, "receipt_uploaded", "Customer uploaded a receipt.");
  revalidateOrders();
  redirect(`${back}?success=Receipt%20uploaded.`);
}
