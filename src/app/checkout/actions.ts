"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

type CheckoutCartLine = {
  productId: string;
  quantity: number;
};

type CheckoutProductRow = {
  id: string;
  vendor_id: string | null;
  price: number | string;
  discount_price: number | string | null;
  inventory: Array<{ quantity: number; status?: string }> | null;
};

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

function parseCartItems(value: FormDataEntryValue | null): CheckoutCartLine[] {
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as Array<Partial<CheckoutCartLine>>;
    const merged = new Map<string, number>();

    parsed.forEach((line) => {
      const productId = String(line.productId ?? "").trim();
      const quantity = Math.max(1, Math.floor(Number(line.quantity ?? 1)));
      if (!productId || !Number.isFinite(quantity)) return;
      merged.set(productId, (merged.get(productId) ?? 0) + quantity);
    });

    return [...merged.entries()].map(([productId, quantity]) => ({ productId, quantity }));
  } catch {
    return [];
  }
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
  const cartItems = parseCartItems(formData.get("cart_items"));

  if (cartItems.length === 0) {
    redirect("/checkout?error=Your%20cart%20is%20empty.%20Add%20products%20before%20checkout.");
  }

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id")
    .eq("state", branchState)
    .maybeSingle();

  if (branchError || !branch) {
    redirect("/checkout?error=Selected%20branch%20is%20not%20available.");
  }

  const cartProductIds = cartItems.map((line) => line.productId);
  const { data: dbProducts, error: productsError } = await supabase
    .from("products")
    .select("id, vendor_id, price, discount_price, inventory(quantity, status)")
    .in("id", cartProductIds)
    .eq("status", "active");

  if (productsError || !dbProducts || dbProducts.length === 0) {
    redirect("/checkout?error=Checkout%20products%20are%20not%20available.");
  }

  // Only keep cart lines whose product was found in the DB.
  const validCartItems = cartItems.filter((line) =>
    (dbProducts as CheckoutProductRow[]).some((p) => p.id === line.productId),
  );
  if (validCartItems.length === 0) {
    redirect("/checkout?error=Checkout%20products%20are%20not%20available.");
  }

  const productById = new Map((dbProducts as CheckoutProductRow[]).map((product) => [product.id, product]));
  const unavailableProduct = validCartItems.find((line) => {
    const product = productById.get(line.productId);
    if (!product) return true;
    const inventoryRows = (product.inventory ?? []) as Array<{ quantity: number; status?: string }>;
    const available = inventoryRows
      .filter((item) => item.status !== "archived")
      .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
    return available < line.quantity;
  });
  if (unavailableProduct) {
    redirect("/checkout?error=One%20or%20more%20products%20are%20out%20of%20stock.");
  }

  const total = validCartItems.reduce((sum, line) => {
    const product = productById.get(line.productId);
    return sum + Number(product?.discount_price ?? product?.price ?? 0) * line.quantity;
  }, 0);
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

  const orderItems = validCartItems.map((line) => {
    const product = productById.get(line.productId);
    const unitPrice = Number(product?.discount_price ?? product?.price ?? 0);
    return {
    order_id: order.id,
    product_id: line.productId,
    vendor_id: product?.vendor_id ?? null,
    quantity: line.quantity,
    unit_price: unitPrice,
    };
  });

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
    .in("id", dbProducts.map((product) => product.vendor_id).filter(Boolean));
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
