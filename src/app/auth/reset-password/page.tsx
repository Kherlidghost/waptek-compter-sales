"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? "Updating password..." : "Set new password"}
    </button>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [show, setShow] = useState(false);

  return (
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-950/5">
      <p className="text-sm font-black uppercase text-emerald-700">Account recovery</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">Set a new password</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Choose a strong password: at least 8 characters with uppercase, lowercase, a number, and a special character.
      </p>

      {error ? (
        <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      ) : null}

      <form action={resetPasswordAction} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          New password
          <div className="flex overflow-hidden rounded-md border border-slate-300">
            <input
              className="h-11 min-w-0 flex-1 px-3 font-normal outline-none"
              name="password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              required
            />
            <button
              type="button"
              className="border-l border-slate-300 px-3 text-xs font-bold text-slate-700"
              onClick={() => setShow((s) => !s)}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-slate-700">
          Confirm new password
          <input
            className="h-11 rounded-md border border-slate-300 px-3 font-normal outline-none focus:border-emerald-600"
            name="confirm_password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat password"
            required
          />
        </label>
        <SubmitButton />
      </form>

      <div className="mt-5 text-center text-sm">
        <Link className="font-bold text-emerald-800 hover:underline" href="/login">
          Back to sign in
        </Link>
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
