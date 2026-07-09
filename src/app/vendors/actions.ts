"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthProfile, isAdmin, isSafeRedirect, isVendor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type VendorStatus = "pending" | "approved" | "rejected" | "suspended" | "inactive";

function cleanFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
}

function returnPath(formData: FormData, fallback = "/become-a-vendor") {
  const value = String(formData.get("return_to") ?? fallback);
  return isSafeRedirect(value) ? value : fallback;
}

async function requireProfile(next = "/become-a-vendor") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const profile = await getAuthProfile(supabase, user.id);
  if (!profile) redirect("/login?error=Your%20account%20profile%20is%20incomplete.%20Please%20contact%20support.");
  return { supabase, user, profile };
}

async function uploadVendorAsset(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || file.size === 0) return null;
  const path = `${userId}/${folder}/${Date.now()}-${cleanFileName(file.name || "vendor-asset")}`;
  const { error } = await supabase.storage.from("vendor-assets").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return path;
}

function revalidateVendorPages() {
  revalidatePath("/become-a-vendor");
  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
  revalidatePath("/vendor");
  revalidatePath("/vendors");
  revalidatePath("/products");
}

export async function submitVendorApplication(formData: FormData) {
  const back = returnPath(formData);
  const { supabase, user } = await requireProfile("/become-a-vendor");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const ownerName = String(formData.get("owner_name") ?? "").trim();
  const businessEmail = String(formData.get("business_email") ?? user.email ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const businessAddress = String(formData.get("business_address") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const businessType = String(formData.get("business_type") ?? "").trim();
  const nationalIdOrCac = String(formData.get("national_id_or_cac") ?? "").trim();
  const agreed = formData.get("agreement") === "on";

  if (!businessName || !ownerName || !businessEmail || !phone || !businessAddress || !state || !city || !businessType || !agreed) {
    redirect(`${back}?error=Complete%20all%20required%20vendor%20application%20fields.`);
  }

  const { data: branch } = await supabase.from("branches").select("id").eq("state", state).maybeSingle();
  if (!branch) redirect(`${back}?error=Selected%20branch%20is%20not%20available.`);

  let profilePhotoPath: string | null = null;
  let businessLogoPath: string | null = null;
  try {
    profilePhotoPath = await uploadVendorAsset(supabase, user.id, formData.get("profile_photo"), "profile");
    businessLogoPath = await uploadVendorAsset(supabase, user.id, formData.get("business_logo"), "logo");
  } catch {
    redirect(`${back}?error=Could%20not%20upload%20vendor%20image.`);
  }

  await supabase.from("profiles").update({ role: "vendor", full_name: ownerName, phone }).eq("id", user.id);
  const { error } = await supabase.from("vendors").upsert(
    {
      profile_id: user.id,
      branch_id: branch.id,
      business_name: businessName,
      business_phone: phone,
      owner_name: ownerName,
      business_email: businessEmail,
      business_address: businessAddress,
      state,
      city,
      business_type: businessType,
      national_id_or_cac: nationalIdOrCac || null,
      profile_photo_path: profilePhotoPath,
      business_logo_path: businessLogoPath,
      status: "pending",
      rejection_reason: null,
      suspension_reason: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id" },
  );
  if (error) redirect(`${back}?error=Could%20not%20submit%20vendor%20application.`);

  await supabase.from("notifications").insert({
    profile_id: user.id,
    channel: "dashboard",
    recipient: user.id,
    message: "Vendor application submitted and pending admin approval.",
    status: "queued",
  });

  revalidateVendorPages();
  redirect("/vendor?success=Vendor%20application%20submitted.%20Pending%20admin%20approval.");
}

export async function updateVendorProfile(formData: FormData) {
  const back = returnPath(formData, "/vendor");
  const { supabase, user, profile } = await requireProfile("/vendor");
  if (!isVendor(profile)) redirect(`${back}?error=Only%20vendor%20accounts%20can%20update%20vendor%20profiles.`);
  const { data: vendor } = await supabase.from("vendors").select("id, status").eq("profile_id", user.id).maybeSingle();
  if (!vendor) redirect(`${back}?error=Vendor%20profile%20not%20found.`);

  const updates = {
    business_name: String(formData.get("business_name") ?? "").trim(),
    owner_name: String(formData.get("owner_name") ?? "").trim(),
    business_phone: String(formData.get("phone") ?? "").trim(),
    business_email: String(formData.get("business_email") ?? user.email ?? "").trim(),
    business_address: String(formData.get("business_address") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    business_type: String(formData.get("business_type") ?? "").trim(),
    updated_at: new Date().toISOString(),
  };
  if (!updates.business_name || !updates.owner_name || !updates.business_phone) {
    redirect(`${back}?error=Business%20name,%20owner,%20and%20phone%20are%20required.`);
  }
  await supabase.from("vendors").update(updates).eq("id", vendor.id).eq("profile_id", user.id);
  revalidateVendorPages();
  redirect(`${back}?success=Vendor%20profile%20updated.`);
}

export async function updateVendorApprovalStatus(formData: FormData) {
  const back = returnPath(formData, "/admin/vendors");
  const vendorId = String(formData.get("vendor_id") ?? "");
  const status = String(formData.get("status") ?? "") as VendorStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  const { supabase, user, profile } = await requireProfile("/admin/vendors");
  if (!isAdmin(profile)) redirect(`${back}?error=Only%20admin%20can%20manage%20vendor%20approval.`);
  if (!vendorId || !["pending", "approved", "rejected", "suspended", "inactive"].includes(status)) redirect(`${back}?error=Invalid%20vendor%20status.`);

  const update: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "approved") {
    update.approved_by = user.id;
    update.approved_at = new Date().toISOString();
    update.rejection_reason = null;
    update.suspension_reason = null;
    update.reactivated_at = new Date().toISOString();
  }
  if (status === "rejected") update.rejection_reason = reason || "Application was not approved.";
  if (status === "suspended") {
    update.suspension_reason = reason || "Vendor account suspended.";
    update.suspended_at = new Date().toISOString();
  }
  if (status === "inactive") update.suspension_reason = reason || "Vendor account set inactive.";

  const { data: vendor } = await supabase.from("vendors").select("profile_id, business_name").eq("id", vendorId).maybeSingle();
  await supabase.from("vendors").update(update).eq("id", vendorId);
  if (vendor?.profile_id) {
    await supabase.from("notifications").insert({
      profile_id: vendor.profile_id,
      channel: "dashboard",
      recipient: vendor.profile_id,
      message: `Vendor application status updated to ${status}.`,
      status: "queued",
    });
  }

  revalidateVendorPages();
  redirect(`${back}?success=Vendor%20status%20updated.`);
}
