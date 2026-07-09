import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";
import { OnlineVendorProductForm } from "@/components/OnlineVendorProductForm";
import { VendorDashboard } from "@/components/VendorDashboard";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="vendor" />
      <VendorDashboard />
      <OnlineVendorProductForm error={params.error} returnTo="/vendor" success={params.success} />
      <OnlineOrderStatusPanel role="vendor" />
    </main>
  );
}
