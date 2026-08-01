"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { ArrowRight, BadgeCheck, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles, Store } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const passwordMismatch = Boolean(confirmPassword && registerPassword !== confirmPassword);
  const passwordWeak = Boolean(
    registerPassword &&
    (
      registerPassword.length < 8 ||
      !/[A-Z]/.test(registerPassword) ||
      !/[a-z]/.test(registerPassword) ||
      !/[0-9]/.test(registerPassword) ||
      !/[^A-Za-z0-9]/.test(registerPassword)
    ),
  );

  return (
    <div className="min-h-screen mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.96fr] items-center">
      <section className="relative hidden overflow-hidden rounded-[32px] border border-primary-800/60 bg-gradient-to-br from-primary-950 via-primary-800 to-primary-700 p-8 text-white shadow-[0_24px_80px_-24px_rgba(2,8,23,0.45)] lg:block lg:min-h-[720px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.3),transparent_28rem)]" aria-hidden="true" />
        <div className="relative flex h-full flex-col">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-100">
            <Sparkles className="h-3.5 w-3.5" />
            Trusted storefront
          </div>

          <div className="mt-8 max-w-md">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent-300">WAPTEK computer services</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              Access your account and keep every order moving.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-200/90">
              Sign in to complete checkout, upload payment receipts, manage orders, or reach your staff and vendor dashboards in one place.
            </p>
          </div>

          <div className="mt-8 grid gap-3 text-sm">
            {[
              { title: "Verified sign-in", text: "Protected pages require a confirmed email address." },
              { title: "Role-aware access", text: "Staff accounts are matched to their profile role automatically." },
              { title: "Faster support", text: "Manual payment receipts are reviewed quickly for smoother processing." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-200">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-200/85">{item.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-3xl border border-white/10 bg-slate-950/20 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-200">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Waptek marketplace</p>
                <p className="text-sm text-slate-300">Sales, repairs, and vendor operations in one streamlined portal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] backdrop-blur sm:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent-700">Secure login</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">Access your WAPTEK account</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Sign in or create your account to continue with orders, receipts, and role-based dashboards.
              </p>
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
              Secure access
            </div>
          </div>

          <div className="grid gap-3 rounded-[24px] bg-slate-100 p-1.5 sm:grid-cols-[1fr_1fr]">
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={`rounded-[20px] px-4 py-3 text-sm font-semibold transition ${activeTab === "signin" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={`rounded-[20px] px-4 py-3 text-sm font-semibold transition ${activeTab === "signup" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Create Account
            </button>
          </div>

          {!isConfigured ? (
            <div className="mt-6 rounded-2xl border border-amber-300/40 bg-amber-50 p-4 text-sm text-amber-700">
              Supabase env vars are not configured yet. Add <span className="font-semibold">NEXT_PUBLIC_SUPABASE_URL</span> and <span className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>.
            </div>
          ) : null}

          {errorMessage ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div> : null}
          {successMessage ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{successMessage}</div> : null}

          <div className="mt-6">
            <div className={activeTab !== "signin" ? "hidden" : "grid gap-4"}>
              <form action={loginAction} className="grid gap-4">
                <input type="hidden" name="next" value={next} />
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Email address
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="wcs-input h-12 pl-11 font-normal" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                  </div>
                </label>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Password
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="wcs-input h-12 pl-11 pr-14 font-normal" name="password" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" required />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => setShowLoginPassword((current) => !current)} type="button" aria-label={showLoginPassword ? "Hide password" : "Show password"}>
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input className="size-4 rounded border-slate-300" name="remember" type="checkbox" />
                    Remember me
                  </label>
                  <Link className="font-semibold text-accent-700 transition hover:text-accent-600" href="/auth/forgot-password">
                    Forgot password?
                  </Link>
                </div>
                <SubmitButton className="btn btn-primary h-12 justify-center rounded-2xl" pendingText="Signing in...">
                  <span>Sign in securely</span>
                  <ArrowRight className="h-4 w-4" />
                </SubmitButton>
              </form>
            </div>

            <div className={activeTab !== "signup" ? "hidden" : "grid gap-4"}>
              <form
                action={signUpAction}
                className="grid gap-4"
                onSubmit={(event) => {
                  if (passwordMismatch || passwordWeak) event.preventDefault();
                }}
              >
                <input type="hidden" name="next" value={next} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Full name
                    <input className="wcs-input h-12 font-normal" name="full_name" placeholder="Full name" required />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Phone number
                    <input className="wcs-input h-12 font-normal" name="phone" placeholder="+234..." required />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Email address
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="wcs-input h-12 pl-11 font-normal" name="email" type="email" autoComplete="email" placeholder="you@example.com" onChange={(event) => setRegisterEmail(event.target.value)} required />
                  </div>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Password
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input className="wcs-input h-12 pl-11 pr-14 font-normal" name="password" type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" minLength={8} onChange={(event) => setRegisterPassword(event.target.value)} placeholder="Min 8 chars, upper, lower, number, symbol" required />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" onClick={() => setShowRegisterPassword((current) => !current)} type="button" aria-label={showRegisterPassword ? "Hide password" : "Show password"}>
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700">
                    Confirm password
                    <input className="wcs-input h-12 font-normal" name="confirm_password" type={showRegisterPassword ? "text" : "password"} autoComplete="new-password" minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" required />
                  </label>
                </div>
                {passwordWeak ? <p className="text-sm font-semibold text-amber-600">Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.</p> : null}
                {passwordMismatch ? <p className="text-sm font-semibold text-rose-600">Password and confirm password must match.</p> : null}
                <SubmitButton className="btn btn-accent h-12 justify-center rounded-2xl" pendingText="Creating account...">
                  <span>Create account</span>
                  <BadgeCheck className="h-4 w-4" />
                </SubmitButton>
              </form>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-950">Check your email to confirm your account.</p>
                <form action={resendConfirmationAction} className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input type="hidden" name="next" value={next} />
                  <input className="h-10 flex-1 rounded-xl border border-slate-300 px-3 text-sm" name="email" type="email" placeholder="Email for confirmation resend" defaultValue={registerEmail} required />
                  <SubmitButton className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-400" pendingText="Sending...">
                    Resend confirmation email
                  </SubmitButton>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
