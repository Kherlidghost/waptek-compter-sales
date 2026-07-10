"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { loginAction, resendConfirmationAction, signUpAction } from "@/app/auth/actions";

function SubmitButton({ children, pendingText, className }: { children: React.ReactNode; pendingText: string; className: string }) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? pendingText : children}
    </button>
  );
}

export function AuthForms({
  next,
  errorMessage,
  successMessage,
  isConfigured,
}: {
  next: string;
  errorMessage: string;
  successMessage?: string;
  isConfigured: boolean;
}) {
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const passwordMismatch = Boolean(confirmPassword && registerPassword !== confirmPassword);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-lg border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
        <p className="text-sm font-bold uppercase text-emerald-300">WAPTEK COMPUTER SERVICES</p>
        <h1 className="mt-3 text-3xl font-black">Sales of Computers & Repairs</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Sign in to complete checkout, upload payment receipts, manage orders, or access staff and vendor dashboards.
        </p>
        <div className="mt-6 grid gap-3 text-sm">
          {[
            "Verified email required for protected pages",
            "Staff roles depend on a matching profile record",
            "Manual payment receipts are reviewed before processing",
          ].map((item) => (
            <div key={item} className="rounded-md border border-white/10 bg-white/5 p-3 font-semibold text-slate-100">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-bold uppercase text-emerald-700">Sign in</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your confirmed email and password. Staff accounts must exist in Supabase Auth and must have a matching profile role.
            </p>
          </div>

          {!isConfigured ? (
            <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Supabase env vars are not configured yet. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
            </div>
          ) : null}

          {errorMessage ? <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div> : null}
          {successMessage ? <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{successMessage}</div> : null}

          <form action={loginAction} className="mt-6 grid gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email address
              <input className="h-11 rounded-md border border-slate-300 px-3 font-normal" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Password
              <div className="flex overflow-hidden rounded-md border border-slate-300">
                <input className="h-11 min-w-0 flex-1 px-3 font-normal outline-none" name="password" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter password" required />
                <button className="border-l border-slate-300 px-3 text-xs font-bold text-slate-700" onClick={() => setShowLoginPassword((current) => !current)} type="button">
                  {showLoginPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input className="size-4 rounded border-slate-300" name="remember" type="checkbox" />
                Remember me on this device
              </label>
              <Link className="font-bold text-emerald-800" href="/contact">
                Forgot password?
              </Link>
            </div>
            <SubmitButton className="rounded-md bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400" pendingText="Signing in...">
              Sign in securely
            </SubmitButton>
          </form>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">Customer registration</p>
          <h2 className="mt-2 text-3xl font-black text-slate-950">Create your account</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Customer accounts require email confirmation before checkout, receipt upload, or order tracking.
          </p>
          <form
            action={signUpAction}
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              if (passwordMismatch) event.preventDefault();
            }}
          >
            <input type="hidden" name="next" value={next} />
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Full name
                <input className="h-11 rounded-md border border-slate-300 px-3 font-normal" name="full_name" placeholder="Full name" required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Phone number
                <input className="h-11 rounded-md border border-slate-300 px-3 font-normal" name="phone" placeholder="+234..." required />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Email address
              <input className="h-11 rounded-md border border-slate-300 px-3 font-normal" name="email" type="email" autoComplete="email" placeholder="you@example.com" onChange={(event) => setRegisterEmail(event.target.value)} required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Password
                <div className="flex overflow-hidden rounded-md border border-slate-300">
                  <input className="h-11 min-w-0 flex-1 px-3 font-normal outline-none" name="password" type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" minLength={8} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Minimum 8 characters" required />
                  <button className="border-l border-slate-300 px-3 text-xs font-bold text-slate-700" onClick={() => setShowRegisterPassword((current) => !current)} type="button">
                    {showRegisterPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700">
                Confirm password
                <input className="h-11 rounded-md border border-slate-300 px-3 font-normal" name="confirm_password" type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" required />
              </label>
            </div>
            {passwordMismatch ? <p className="text-sm font-semibold text-red-700">Password and confirm password must match.</p> : null}
            <SubmitButton className="rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400" pendingText="Creating account...">
              Create account
            </SubmitButton>
          </form>

          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-950">Check your email to confirm your account.</p>
            <form action={resendConfirmationAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
              <input type="hidden" name="next" value={next} />
              <input className="h-10 flex-1 rounded-md border border-slate-300 px-3 text-sm" name="email" type="email" placeholder="Email for confirmation resend" defaultValue={registerEmail} required />
              <SubmitButton className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400" pendingText="Sending...">
                Resend confirmation email
              </SubmitButton>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
