"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isVendor } from "@/lib/auth";
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

  if (!user) redirect("/login?next=/vendor");

  const profile = await getAuthProfile(supabase, user.id);
  if (!profile || !isVendor(profile)) {
    redirect("/vendor?error=Only%20approved%20vendor%20accounts%20can%20upload%20products.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categorySlug = String(formData.get("category_slug") ?? "laptops");
  const branchState = String(formData.get("branch_state") ?? "Adamawa");
  const condition = String(formData.get("condition") ?? "New");
  const price = Number(formData.get("price") ?? 0);
  const quantity = Number(formData.get("quantity") ?? 0);
  const image = formData.get("image");

  if (!name || !description || !Number.isFinite(price) || price <= 0 || !Number.isFinite(quantity) || quantity < 0) {
    redirect("/vendor?error=Enter%20valid%20product%20details.");
  }

  if (!(image instanceof File) || image.size === 0) {
    redirect("/vendor?error=Upload%20a%20product%20image.");
  }

  const [{ data: vendor }, { data: category }, { data: branch }] = await Promise.all([
    supabase.from("vendors").select("id").eq("profile_id", user.id).eq("status", "approved").maybeSingle(),
    supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle(),
    supabase.from("branches").select("id").eq("state", branchState).maybeSingle(),
  ]);

  if (!vendor || !category || !branch) {
    redirect("/vendor?error=Vendor%2C%20category%2C%20or%20branch%20setup%20is%20missing.");
  }

  const baseSlug = slugify(name);
  const productSlug = `${baseSlug}-${Date.now().toString().slice(-5)}`;

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      vendor_id: vendor.id,
      category_id: category.id,
      branch_id: branch.id,
      name,
      slug: productSlug,
      description,
      price,
      condition,
      status: "active",
    })
    .select("id")
    .single();

  if (productError || !product) {
    redirect("/vendor?error=Could%20not%20create%20product.");
  }

  const imagePath = `${vendor.id}/${product.id}/${Date.now()}-${cleanFileName(image.name || "product-image")}`;
  const { error: uploadError } = await supabase.storage
    .from(supabaseConfig.storageBuckets.productImages)
    .upload(imagePath, image, {
      contentType: image.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    redirect("/vendor?error=Product%20created%20but%20image%20upload%20failed.");
  }

  await supabase.from("product_images").insert({
    product_id: product.id,
    storage_path: imagePath,
    alt_text: name,
    is_primary: true,
  });

  await supabase.from("inventory").insert({
    product_id: product.id,
    branch_id: branch.id,
    quantity,
  });

  revalidatePath("/products");
  revalidatePath("/vendor");
  redirect("/vendor?success=Product%20created%20online%20with%20Supabase%20Storage%20image.");
}
