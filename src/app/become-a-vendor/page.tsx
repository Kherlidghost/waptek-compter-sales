import { submitVendorApplication } from "@/app/vendors/actions";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BecomeVendorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: branches } = await supabase.from("branches").select("id, name, state, city").order("state");

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-xl shadow-slate-950/5">
          <p className="text-sm font-bold uppercase text-emerald-700">Vendor onboarding</p>
          <h1 className="text-4xl font-black text-slate-950">Sell Your Computer Products on WAPTEK COMPUTER SERVICES</h1>
          <p className="text-base leading-7 text-slate-600">
            Join our verified vendor network and reach customers looking for laptops, desktops, accessories, components, and repair-related products across Adamawa, Yobe, and Borno.
          </p>
          <div className="grid gap-3">
            {["Admin reviews each application.", "Approved vendors can upload products and manage inventory.", "Rejected or suspended vendors cannot publish products."].map((item) => (
              <p key={item} className="rounded-md border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700">{item}</p>
            ))}
          </div>
          {!user ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Sign in or create a customer account first. After login, return here to submit your vendor application.
            </p>
          ) : null}
        </section>

        <form action={submitVendorApplication} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/8">
          <input type="hidden" name="return_to" value="/vendor/register" />
          <h2 className="text-2xl font-black text-slate-950">Vendor registration form</h2>
          <p className="mt-2 text-sm text-slate-600">Your application will be saved as Pending Approval until an admin reviews it.</p>
          {params.error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{params.error}</p> : null}
          {params.success ? <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{params.success}</p> : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input className="wcs-input" name="business_name" placeholder="Business Name" required />
            <input className="wcs-input" name="owner_name" placeholder="Owner Full Name" required />
            <input className="wcs-input" name="business_email" type="email" placeholder="Email" defaultValue={user?.email ?? ""} required />
            <input className="wcs-input" name="phone" placeholder="Phone Number" required />
            <input className="wcs-input sm:col-span-2" name="business_address" placeholder="Business Address" required />
            <select className="wcs-input" name="state" required>
              <option value="">State</option>
              {(branches ?? []).map((branch) => <option key={branch.id} value={branch.state}>{branch.state}</option>)}
            </select>
            <input className="wcs-input" name="city" placeholder="City" required />
            <select className="wcs-input" name="business_type" required>
              <option value="">Business Type</option>
              <option>Computer Sales</option>
              <option>Accessories Sales</option>
              <option>Repair Services</option>
              <option>Components Supplier</option>
            </select>
            <input className="wcs-input" name="national_id_or_cac" placeholder="National ID or CAC Number (optional)" />
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Profile Photo (optional)
              <input className="rounded-md border border-slate-300 px-3 py-2" name="profile_photo" type="file" accept="image/*" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Business Logo (optional)
              <input className="rounded-md border border-slate-300 px-3 py-2" name="business_logo" type="file" accept="image/*" />
            </label>
          </div>
          <label className="mt-5 flex gap-3 text-sm font-semibold text-slate-700">
            <input name="agreement" type="checkbox" required />
            I agree to the Marketplace Terms.
          </label>
          <button className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-sm shadow-emerald-950/10 hover:bg-emerald-800" type="submit">
            Submit Vendor Application
          </button>
        </form>
      </main>
      <PublicFooter />
    </div>
  );
}
