import Link from "next/link";
import { forgotPasswordAction } from "@/app/auth/actions";
import { PublicFooter } from "@/components/PublicFooter";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
        <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5">
          <p className="text-sm font-black uppercase text-emerald-700">Account recovery</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Enter your account email address. If an account exists, we will send a password reset link.
          </p>

          {params.error ? (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {params.error}
            </div>
          ) : null}
          {params.success ? (
            <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              {params.success}
            </div>
          ) : null}

          <form action={forgotPasswordAction} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email address
              <input
                className="h-11 rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
            >
              Send reset link
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            <Link className="font-bold text-emerald-800 hover:underline" href="/login">
              Back to sign in
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
