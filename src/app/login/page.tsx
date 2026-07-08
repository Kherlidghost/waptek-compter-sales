import Link from "next/link";
import { loginAction, signUpAction } from "@/app/auth/actions";
import { isSupabaseConfigured } from "@/lib/supabase-config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">Supabase auth</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Staff and vendors are routed by the `profiles.role` field. Customers return to the storefront.
          </p>

          {!isSupabaseConfigured() ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Supabase env vars are not configured yet. Add `NEXT_PUBLIC_SUPABASE_URL` and
              `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.example`.
            </div>
          ) : null}

          {params.error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{params.error}</div>
          ) : null}
          {params.success ? (
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{params.success}</div>
          ) : null}

          <form action={loginAction} className="mt-6 grid gap-4">
            <input type="hidden" name="next" value={next} />
            <input className="h-11 rounded-md border border-slate-300 px-3" name="email" type="email" placeholder="Email address" required />
            <input className="h-11 rounded-md border border-slate-300 px-3" name="password" type="password" placeholder="Password" required />
            <button className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700">
              Sign in
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">Customer account</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Create account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            New users start as customers. A vendor can apply for approval, and admin promotes the account after review.
          </p>
          <form action={signUpAction} className="mt-6 grid gap-4">
            <input className="h-11 rounded-md border border-slate-300 px-3" name="full_name" placeholder="Full name" required />
            <input className="h-11 rounded-md border border-slate-300 px-3" name="phone" placeholder="Phone number" />
            <input className="h-11 rounded-md border border-slate-300 px-3" name="email" type="email" placeholder="Email address" required />
            <input className="h-11 rounded-md border border-slate-300 px-3" name="password" type="password" placeholder="Password" required minLength={6} />
            <button className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
              Create account
            </button>
          </form>
        </section>
      </div>
      <div className="mx-auto mt-6 max-w-6xl">
        <Link className="text-sm font-bold text-emerald-800" href="/">Back to marketplace</Link>
      </div>
    </main>
  );
}
