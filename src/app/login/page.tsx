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
    <div className="min-h-screen marketplace-shell text-slate-900">
      <main className="px-4 py-10">
      <AuthForms next={next} errorMessage={errorMessage} successMessage={params.success} isConfigured={isSupabaseConfigured()} />
      <div className="mx-auto mt-6 max-w-6xl">
        <Link className="text-sm font-bold text-emerald-800" href="/">Back to marketplace</Link>
      </div>
      </main>
      <PublicFooter />
    </div>
  );
}
