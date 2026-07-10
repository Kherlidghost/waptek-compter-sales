"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isAdmin, isManager, isVendor } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

type ProductStatus = "draft" | "active" | "inactive" | "archived" | "rejected";

function toNumber(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalNumber(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function skuFromName(name: string) {
  return `SKU-${slugify(name).slice(0, 18).toUpperCase()}-${Date.now().toString().slice(-5)}`;
}

function returnPath(formData: FormData) {
  const value = String(formData.get("return_to") ?? "/vendor/products");
  return value === "/admin/products" || value === "/manager/products" || value === "/vendor/products" ? value : "/vendor/products";
}

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/products/manage");
  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) redirect("/login?error=Your%20account%20profile%20is%20incomplete.%20Please%20contact%20support.");
  return { supabase, user, profile };
}

async function getProductScope(supabase: Awaited<ReturnType<typeof createClient>>, productId: string) {
  const { data } = await supabase.from("products").select("id, vendor_id, branch_id").eq("id", productId).maybeSingle();
  return data as { id: string; vendor_id: string | null; branch_id: string } | null;
}

async function canManageProduct(productId: string) {
  const { supabase, profile } = await requireProfile();
  const product = await getProductScope(supabase, productId);
  if (!product) return { supabase, profile, product: null, allowed: false };

  if (isAdmin(profile)) return { supabase, profile, product, allowed: true };
  if (isManager(profile)) return { supabase, profile, product, allowed: profile.branch_id === product.branch_id };
  if (isVendor(profile)) {
    const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", profile.id).eq("status", "approved").maybeSingle();
    return { supabase, profile, product, allowed: vendor?.id === product.vendor_id };
  }

  return { supabase, profile, product, allowed: false };
}

function revalidateProductPages() {
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/manager/products");
  revalidatePath("/vendor/products");
  revalidatePath("/admin");
  revalidatePath("/manager");
  revalidatePath("/vendor");
}

export async function updateManagedProduct(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const back = returnPath(formData);
  const { supabase, product, allowed } = await canManageProduct(productId);
  if (!allowed || !product) redirect(`${back}?error=You%20cannot%20edit%20that%20product.`);

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim() || skuFromName(name);
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const specifications = String(formData.get("specifications") ?? "").trim();
  const warranty = String(formData.get("warranty") ?? "").trim();
  const price = toNumber(formData.get("price"));
  const discountPrice = toOptionalNumber(formData.get("discount_price"));
  const condition = String(formData.get("condition") ?? "New");
  const featured = formData.get("featured") === "on";

  if (!name || !description || price < 0) redirect(`${back}?error=Enter%20valid%20product%20details.`);

  await supabase
    .from("products")
    .update({
      name,
      sku,
      brand,
      description,
      specifications,
      warranty,
      price,
      discount_price: discountPrice,
      condition,
      featured,
    })
    .eq("id", productId);

  revalidateProductPages();
  redirect(`${back}?success=Product%20updated.`);
}

export async function updateProductStatus(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const back = returnPath(formData);
  const status = String(formData.get("status") ?? "draft") as ProductStatus;
  const { supabase, product, allowed } = await canManageProduct(productId);
  if (!allowed || !product) redirect(`${back}?error=You%20cannot%20update%20that%20product.`);

  await supabase.from("products").update({ status }).eq("id", productId);
  revalidateProductPages();
  redirect(`${back}?success=Product%20status%20updated.`);
}

export async function updateProductInventory(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const back = returnPath(formData);
  const quantity = Math.max(0, toNumber(formData.get("quantity")));
  const reorderLevel = Math.max(0, toNumber(formData.get("reorder_level")));
  const { supabase, product, allowed } = await canManageProduct(productId);
  if (!allowed || !product) redirect(`${back}?error=You%20cannot%20update%20that%20inventory.`);

  await supabase
    .from("inventory")
    .upsert({ product_id: productId, branch_id: product.branch_id, quantity, reorder_level: reorderLevel }, { onConflict: "product_id,branch_id" });

  revalidateProductPages();
  redirect(`${back}?success=Inventory%20updated.`);
}

export async function deleteManagedProduct(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const back = returnPath(formData);
  const { supabase, profile, product } = await canManageProduct(productId);
  if (!isAdmin(profile) || !product) redirect(`${back}?error=Only%20admin%20can%20delete%20products.`);

  const { data: images } = await supabase.from("product_images").select("storage_path").eq("product_id", productId);
  const paths = (images ?? []).map((image) => image.storage_path).filter(Boolean);
  if (paths.length > 0) {
    await supabase.storage.from(supabaseConfig.storageBuckets.productImages).remove(paths);
  }
  await supabase.from("products").delete().eq("id", productId);

  revalidateProductPages();
  redirect(`${back}?success=Product%20deleted.`);
}

export async function deleteProductImage(formData: FormData) {
  const productId = String(formData.get("product_id") ?? "");
  const back = returnPath(formData);
  const imageId = String(formData.get("image_id") ?? "");
  const storagePath = String(formData.get("storage_path") ?? "");
  const { supabase, product, allowed } = await canManageProduct(productId);
  if (!allowed || !product) redirect(`${back}?error=You%20cannot%20delete%20that%20image.`);

  await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
  if (storagePath) {
    await supabase.storage.from(supabaseConfig.storageBuckets.productImages).remove([storagePath]);
  }

  revalidateProductPages();
  redirect(`${back}?success=Image%20deleted.`);
}

export async function bulkProductAction(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const back = returnPath(formData);
  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20run%20bulk%20actions.`);
  const action = String(formData.get("bulk_action") ?? "");
  const productIds = formData.getAll("product_ids").map(String).filter(Boolean);
  if (productIds.length === 0) redirect(`${back}?error=Select%20at%20least%20one%20product.`);

  if (action === "publish") {
    await supabase.from("products").update({ status: "active" }).in("id", productIds);
  } else if (action === "archive") {
    await supabase.from("products").update({ status: "archived" }).in("id", productIds);
  } else if (action === "delete") {
    await supabase.from("products").delete().in("id", productIds);
  }

  revalidateProductPages();
  redirect(`${back}?success=Bulk%20action%20completed.`);
}
