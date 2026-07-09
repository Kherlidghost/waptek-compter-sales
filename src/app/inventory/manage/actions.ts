"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isAdmin, isManager, isSafeRedirect, isVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type InventoryStatus = "active" | "damaged" | "archived";
type MovementType = "stock_added" | "stock_removed" | "sale" | "transfer_out" | "transfer_in" | "damaged" | "adjustment";

function toPositiveInt(value: FormDataEntryValue | null) {
  const parsed = Math.floor(Number(value ?? 0));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function returnPath(formData: FormData) {
  const value = String(formData.get("return_to") ?? "/vendor/inventory");
  return isSafeRedirect(value) ? value : "/vendor/inventory";
}

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/products");

  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) redirect("/login?error=Your%20account%20profile%20is%20incomplete.%20Please%20contact%20support.");

  return { supabase, user, profile };
}

async function getProductScope(supabase: Awaited<ReturnType<typeof createClient>>, productId: string) {
  const { data } = await supabase.from("products").select("id, vendor_id, branch_id, name").eq("id", productId).maybeSingle();
  return data as { id: string; vendor_id: string; branch_id: string; name: string } | null;
}

async function getVendorId(supabase: Awaited<ReturnType<typeof createClient>>, profileId: string) {
  const { data } = await supabase.from("vendors").select("id").eq("profile_id", profileId).eq("status", "approved").maybeSingle();
  return data?.id ?? null;
}

async function canManageInventory(product: { vendor_id: string; branch_id: string }, branchId: string) {
  const { supabase, user, profile } = await requireProfile();
  if (isAdmin(profile)) return { supabase, user, profile, allowed: true };
  if (isManager(profile)) return { supabase, user, profile, allowed: profile.branch_id === branchId };
  if (isVendor(profile)) {
    const vendorId = await getVendorId(supabase, profile.id);
    return { supabase, user, profile, allowed: vendorId === product.vendor_id };
  }
  return { supabase, user, profile, allowed: false };
}

async function fetchInventory(supabase: Awaited<ReturnType<typeof createClient>>, productId: string, branchId: string) {
  const { data } = await supabase
    .from("inventory")
    .select("id, quantity, reorder_level, status, damaged_quantity")
    .eq("product_id", productId)
    .eq("branch_id", branchId)
    .maybeSingle();
  return data as { id: string; quantity: number; reorder_level: number; status: InventoryStatus; damaged_quantity: number } | null;
}

async function saveInventory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: {
    productId: string;
    branchId: string;
    quantity: number;
    reorderLevel: number;
    status?: InventoryStatus;
    damagedQuantity?: number;
    userId: string;
  },
) {
  const { data, error } = await supabase
    .from("inventory")
    .upsert(
      {
        product_id: values.productId,
        branch_id: values.branchId,
        quantity: Math.max(0, values.quantity),
        reorder_level: Math.max(0, values.reorderLevel),
        status: values.status ?? "active",
        damaged_quantity: Math.max(0, values.damagedQuantity ?? 0),
        archived_at: values.status === "archived" ? new Date().toISOString() : null,
        updated_by: values.userId,
      },
      { onConflict: "product_id,branch_id" },
    )
    .select("id, quantity, reorder_level, status, damaged_quantity")
    .single();

  if (error) throw new Error(error.message);
  return data as { id: string; quantity: number; reorder_level: number; status: InventoryStatus; damaged_quantity: number };
}

async function logMovement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  values: {
    inventoryId?: string | null;
    productId: string;
    branchId: string;
    profileId: string;
    role: string;
    movementType: MovementType;
    quantity: number;
    reason?: string;
  },
) {
  await supabase.from("inventory_movements").insert({
    inventory_id: values.inventoryId ?? null,
    product_id: values.productId,
    branch_id: values.branchId,
    profile_id: values.profileId,
    role: values.role,
    movement_type: values.movementType,
    quantity: values.quantity,
    reason: values.reason || null,
  });
}

async function notifyLowStock(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productName: string,
  branchId: string,
  quantity: number,
  reorderLevel: number,
) {
  if (quantity > reorderLevel) return;
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  const { data: branchStaff } = await supabase.from("profiles").select("id").in("role", ["manager", "cashier"]).eq("branch_id", branchId);
  const rows = [...(admins ?? []), ...(branchStaff ?? [])].map((profile) => ({
    profile_id: profile.id,
    channel: "dashboard",
    recipient: profile.id,
    message: `${productName} is ${quantity === 0 ? "out of stock" : "low stock"} at this branch.`,
    status: "queued",
  }));
  if (rows.length > 0) await supabase.from("notifications").insert(rows);
}

function revalidateInventoryPages() {
  revalidatePath("/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/manager/inventory");
  revalidatePath("/vendor/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/manager/products");
  revalidatePath("/vendor/products");
  revalidatePath("/admin");
  revalidatePath("/manager");
  revalidatePath("/vendor");
}

export async function updateInventoryStock(formData: FormData) {
  const back = returnPath(formData);
  const productId = String(formData.get("product_id") ?? "");
  const requestedBranchId = String(formData.get("branch_id") ?? "");
  const action = String(formData.get("stock_action") ?? "adjustment");
  const quantity = toPositiveInt(formData.get("quantity"));
  const reorderLevelInput = Math.max(0, Math.floor(Number(formData.get("reorder_level") ?? 3)));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!productId || !requestedBranchId) redirect(`${back}?error=Enter%20valid%20inventory%20details.`);

  const { supabase, user, profile } = await requireProfile();
  const product = await getProductScope(supabase, productId);
  if (!product) redirect(`${back}?error=Product%20not%20found.`);
  const branchId = isManager(profile) && profile.branch_id ? profile.branch_id : requestedBranchId;
  const scope = await canManageInventory(product, branchId);
  if (!scope.allowed) redirect(`${back}?error=You%20cannot%20manage%20that%20inventory.`);

  const existing = await fetchInventory(supabase, productId, branchId);
  const current = existing?.quantity ?? 0;
  const reorderLevel = reorderLevelInput || existing?.reorder_level || 3;
  let nextQuantity = current;
  let status: InventoryStatus = existing?.status ?? "active";
  let movementType: MovementType = "adjustment";
  const movementQuantity = quantity || Math.max(1, current);
  let damagedQuantity = existing?.damaged_quantity ?? 0;

  if (action === "add") {
    nextQuantity = current + quantity;
    movementType = "stock_added";
    status = "active";
  } else if (action === "remove") {
    nextQuantity = Math.max(0, current - quantity);
    movementType = "stock_removed";
  } else if (action === "set") {
    nextQuantity = quantity;
    movementType = "adjustment";
  } else if (action === "damaged") {
    nextQuantity = Math.max(0, current - quantity);
    damagedQuantity += quantity;
    movementType = "damaged";
    status = nextQuantity === 0 ? "damaged" : "active";
  } else if (action === "out_of_stock") {
    nextQuantity = 0;
    movementType = "adjustment";
  } else if (action === "archive") {
    status = "archived";
    movementType = "adjustment";
  }

  const inventory = await saveInventory(supabase, {
    productId,
    branchId,
    quantity: nextQuantity,
    reorderLevel,
    status,
    damagedQuantity,
    userId: user.id,
  });
  await logMovement(supabase, {
    inventoryId: inventory.id,
    productId,
    branchId,
    profileId: user.id,
    role: profile.role,
    movementType,
    quantity: movementQuantity,
    reason,
  });
  await notifyLowStock(supabase, product.name, branchId, nextQuantity, reorderLevel);

  revalidateInventoryPages();
  redirect(`${back}?success=Inventory%20updated.`);
}

export async function transferInventoryStock(formData: FormData) {
  const back = returnPath(formData);
  const productId = String(formData.get("product_id") ?? "");
  const sourceBranchId = String(formData.get("source_branch_id") ?? "");
  const destinationBranchId = String(formData.get("destination_branch_id") ?? "");
  const quantity = toPositiveInt(formData.get("quantity"));
  const reason = String(formData.get("reason") ?? "").trim();
  const { supabase, user, profile } = await requireProfile();

  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20transfer%20stock.`);
  if (!productId || !sourceBranchId || !destinationBranchId || sourceBranchId === destinationBranchId || quantity <= 0) {
    redirect(`${back}?error=Enter%20a%20valid%20stock%20transfer.`);
  }

  const product = await getProductScope(supabase, productId);
  if (!product) redirect(`${back}?error=Product%20not%20found.`);
  const source = await fetchInventory(supabase, productId, sourceBranchId);
  if (!source || source.quantity < quantity) redirect(`${back}?error=Source%20branch%20does%20not%20have%20enough%20stock.`);
  const destination = await fetchInventory(supabase, productId, destinationBranchId);
  const destinationReorder = destination?.reorder_level ?? source.reorder_level ?? 3;

  const updatedSource = await saveInventory(supabase, {
    productId,
    branchId: sourceBranchId,
    quantity: source.quantity - quantity,
    reorderLevel: source.reorder_level,
    status: source.status === "archived" ? "archived" : "active",
    damagedQuantity: source.damaged_quantity,
    userId: user.id,
  });
  const updatedDestination = await saveInventory(supabase, {
    productId,
    branchId: destinationBranchId,
    quantity: (destination?.quantity ?? 0) + quantity,
    reorderLevel: destinationReorder,
    status: "active",
    damagedQuantity: destination?.damaged_quantity ?? 0,
    userId: user.id,
  });

  await supabase.from("stock_transfers").insert({
    product_id: productId,
    source_branch_id: sourceBranchId,
    destination_branch_id: destinationBranchId,
    quantity,
    reason: reason || null,
    status: "completed",
    created_by: user.id,
    completed_at: new Date().toISOString(),
  });
  await logMovement(supabase, { inventoryId: updatedSource.id, productId, branchId: sourceBranchId, profileId: user.id, role: profile.role, movementType: "transfer_out", quantity, reason });
  await logMovement(supabase, { inventoryId: updatedDestination.id, productId, branchId: destinationBranchId, profileId: user.id, role: profile.role, movementType: "transfer_in", quantity, reason });
  await notifyLowStock(supabase, product.name, sourceBranchId, updatedSource.quantity, updatedSource.reorder_level);

  revalidateInventoryPages();
  redirect(`${back}?success=Stock%20transferred.`);
}
