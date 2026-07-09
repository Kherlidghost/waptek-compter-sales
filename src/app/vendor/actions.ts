"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isAdmin, isManager, isSafeRedirect, isVendor, roleHome } from "@/lib/auth";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

export async function createOnlineVendorProduct(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const returnTo = String(formData.get("return_to") ?? "/vendor");
  const safeReturnTo = isSafeRedirect(returnTo) ? returnTo : "/vendor";
  const errorRedirect = (message: string): never => redirect(`${safeReturnTo}?error=${encodeURIComponent(message)}#add-product`);
  const successRedirect = (message: string): never => redirect(`${safeReturnTo}?success=${encodeURIComponent(message)}#add-product`);

  if (!user) redirect(`/login?next=${encodeURIComponent(safeReturnTo)}`);

  const profile = await getAuthProfile(supabase, user.id);
  if (!profile || (!isVendor(profile) && !isAdmin(profile) && !isManager(profile))) {
    errorRedirect("Only admin, manager, and approved vendor accounts can upload products.");
  }
  const authProfile = profile!;

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim() || `SKU-${slugify(name).slice(0, 18).toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const brand = String(formData.get("brand") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const specifications = String(formData.get("specifications") ?? "").trim();
  const warranty = String(formData.get("warranty") ?? "").trim();
  const categorySlug = String(formData.get("category_slug") ?? "laptops");
  const branchState = String(formData.get("branch_state") ?? "Adamawa");
  const condition = String(formData.get("condition") ?? "New");
  const status = String(formData.get("status") ?? "active");
  const selectedVendorId = String(formData.get("vendor_id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  const discountPriceRaw = String(formData.get("discount_price") ?? "").trim();
  const discountPrice = discountPriceRaw ? Number(discountPriceRaw) : null;
  const quantity = Number(formData.get("quantity") ?? 0);
  const reorderLevel = Number(formData.get("low_stock_threshold") ?? 3);
  const featured = formData.get("featured") === "on";
  const imageFiles = formData.getAll("images").filter((image): image is File => image instanceof File && image.size > 0);

  if (!name || !brand || !description || !Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity < 0 || !Number.isFinite(reorderLevel)) {
    errorRedirect("Enter valid product details.");
  }

  if (discountPrice !== null && (!Number.isFinite(discountPrice) || discountPrice < 0)) {
    errorRedirect("Enter a valid discount price.");
  }

  if (imageFiles.length === 0) errorRedirect("Upload at least one product image.");

  const vendorQuery = isVendor(authProfile)
    ? supabase.from("vendors").select("id, branch_id").eq("profile_id", user.id).eq("status", "approved").maybeSingle()
    : supabase.from("vendors").select("id, branch_id").eq("id", selectedVendorId).eq("status", "approved").maybeSingle();

  const [{ data: vendor }, { data: category }, { data: branch }] = await Promise.all([
    vendorQuery,
    supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle(),
    supabase.from("branches").select("id").eq("state", branchState).maybeSingle(),
  ]);

  if (!vendor || !category || !branch) {
    errorRedirect("Vendor, category, or branch setup is missing.");
  }
  const productVendor = vendor!;
  const productCategory = category!;
  const productBranch = branch!;

  if (isManager(authProfile) && authProfile.branch_id !== productBranch.id) {
    errorRedirect("Managers can only upload products for their assigned branch.");
  }

  if ((isManager(authProfile) || isAdmin(authProfile)) && productVendor.branch_id !== productBranch.id) {
    errorRedirect("Selected vendor must belong to the selected branch.");
  }

  const baseSlug = slugify(name);
  const productSlug = `${baseSlug}-${Date.now().toString().slice(-5)}`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      vendor_id: productVendor.id,
      category_id: productCategory.id,
      branch_id: productBranch.id,
      name,
      slug: productSlug,
      sku,
      brand,
      description,
      specifications,
      price,
      discount_price: discountPrice,
      warranty,
      condition,
      status,
      featured,
    })
    .select("id")
    .single();

  if (productError || !product) {
    errorRedirect("Could not create product.");
  }
  const createdProduct = product!;

  const uploadedImages: Array<{ product_id: string; storage_path: string; alt_text: string; is_primary: boolean }> = [];
  for (const [index, imageFile] of imageFiles.entries()) {
    const imagePath = `${productVendor.id}/${createdProduct.id}/${Date.now()}-${index}-${cleanFileName(imageFile.name || "product-image")}`;
    const { error: uploadError } = await supabase.storage
      .from(supabaseConfig.storageBuckets.productImages)
      .upload(imagePath, imageFile, {
        contentType: imageFile.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      errorRedirect("Product created but image upload failed.");
    }

    uploadedImages.push({
      product_id: createdProduct.id,
      storage_path: imagePath,
      alt_text: name,
      is_primary: index === 0,
    });
  }

  if (uploadedImages.length > 0) {
    await supabase.from("product_images").insert(uploadedImages);
  }

  await supabase.from("inventory").insert({
    product_id: createdProduct.id,
    branch_id: productBranch.id,
    quantity,
    reorder_level: Math.max(0, reorderLevel),
  });

  revalidatePath("/products");
  revalidatePath(roleHome[authProfile.role]);
  successRedirect("Product created online with Supabase Storage image.");
}
