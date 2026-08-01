import Link from "next/link";
import { AuthForms } from "@/components/AuthForms";
import { PublicFooter } from "@/components/PublicFooter";
import { isSupabaseConfigured } from "@/lib/supabase-config";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "";
  const errorMessage =
    typeof params.error === "string" && params.error.trim()
      ? params.error
      : params.error
        ? "Login failed. Please check your email and password."
        : "";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_38%),linear-gradient(135deg,#f8fbff_0%,#f3f7fb_100%)] text-slate-900">
      <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <AuthForms next={next} errorMessage={errorMessage} successMessage={params.success} isConfigured={isSupabaseConfigured()} />
        <div className="mx-auto mt-6 max-w-7xl">
          <Link className="inline-flex items-center text-sm font-semibold text-emerald-800 transition hover:text-emerald-700" href="/">
            ← Back to marketplace
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
