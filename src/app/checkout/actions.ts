"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

const checkoutProductSlugs = ["hp-elitebook-840-g6", "logitech-wireless-keyboard-mouse"];

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

async function notifyProfiles(supabase: Awaited<ReturnType<typeof createClient>>, profileIds: Array<string | null | undefined>, message: string) {
  const rows = [...new Set(profileIds.filter(Boolean) as string[])].map((profileId) => ({
    profile_id: profileId,
    channel: "dashboard",
    recipient: profileId,
    message,
    status: "queued",
  }));
  if (rows.length > 0) await supabase.from("notifications").insert(rows);
}

export async function createCheckoutOrder(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/checkout&error=Sign%20in%20before%20checkout.");
  }

  const receipt = formData.get("receipt");
  if (!(receipt instanceof File) || receipt.size === 0) {
    redirect("/checkout?error=Upload%20a%20payment%20receipt%20before%20submitting.");
  }

  const branchState = String(formData.get("branch_state") ?? "Adamawa");
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "").trim();
  const supportNote = String(formData.get("support_note") ?? "").trim();

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id")
    .eq("state", branchState)
    .maybeSingle();

  if (branchError || !branch) {
    redirect("/checkout?error=Selected%20branch%20is%20not%20available.");
  }

  const { data: dbProducts, error: productsError } = await supabase
    .from("products")
    .select("id, vendor_id, slug, price")
    .in("slug", checkoutProductSlugs)
    .eq("status", "active");

  if (productsError || !dbProducts || dbProducts.length === 0) {
    redirect("/checkout?error=Checkout%20products%20are%20not%20available.");
  }

  const total = dbProducts.reduce((sum, item) => sum + Number(item.price), 0);
  const orderNumber = `ORD-${Date.now().toString().slice(-8)}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      profile_id: user.id,
      branch_id: branch.id,
      customer_name: customerName || user.email || "Customer",
      customer_phone: customerPhone || "Not provided",
      customer_email: customerEmail || user.email,
      status: "receipt_uploaded",
      total,
      delivery_method: "Pickup",
      payment_method: "Manual bank transfer",
      support_note: supportNote || null,
    })
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    redirect("/checkout?error=Could%20not%20create%20order.");
  }

  const orderItems = dbProducts.map((product) => ({
    order_id: order.id,
    product_id: product.id,
    vendor_id: product.vendor_id,
    quantity: 1,
    unit_price: product.price,
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    redirect("/checkout?error=Could%20not%20save%20order%20items.");
  }

  const receiptPath = `${user.id}/${order.id}/${Date.now()}-${cleanFileName(receipt.name || "receipt")}`;
  const { error: uploadError } = await supabase.storage
    .from(supabaseConfig.storageBuckets.paymentReceipts)
    .upload(receiptPath, receipt, {
      contentType: receipt.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    redirect("/checkout?error=Could%20not%20upload%20receipt.");
  }

  const { error: receiptError } = await supabase.from("payment_receipts").insert({
    order_id: order.id,
    uploaded_by: user.id,
    storage_path: receiptPath,
    amount: total,
    status: "pending",
  });

  if (receiptError) {
    redirect("/checkout?error=Receipt%20uploaded%20but%20could%20not%20be%20linked%20to%20the%20order.");
  }

  await supabase.from("order_events").insert([
    {
      order_id: order.id,
      profile_id: user.id,
      event_type: "order_created",
      note: "Customer placed the order.",
    },
    {
      order_id: order.id,
      profile_id: user.id,
      event_type: "receipt_uploaded",
      note: "Customer uploaded payment receipt.",
    },
  ]);

  const { data: adminProfiles } = await supabase.from("profiles").select("id").eq("role", "admin");
  const { data: branchStaffProfiles } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["manager", "cashier"])
    .eq("branch_id", branch.id);
  const { data: vendorProfiles } = await supabase
    .from("vendors")
    .select("profile_id")
    .in("id", dbProducts.map((product) => product.vendor_id));
  await notifyProfiles(
    supabase,
    [
      user.id,
      ...(adminProfiles ?? []).map((profile) => profile.id),
      ...(branchStaffProfiles ?? []).map((profile) => profile.id),
      ...(vendorProfiles ?? []).map((vendor) => vendor.profile_id),
    ],
    `New order ${order.order_number} was placed with receipt uploaded.`,
  );

  revalidatePath("/orders");
  revalidatePath("/cashier");
  redirect(`/order-confirmation?order=${encodeURIComponent(order.order_number)}`);
}
