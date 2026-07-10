import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { SettingsDashboard } from "@/components/SettingsDashboard";

export const dynamic = "force-dynamic";

export default async function VendorSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen dashboard-shell px-4 py-6 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6">
        <DashboardSessionBar role="vendor" />
        <SettingsDashboard role="vendor" searchParams={params} />
      </div>
    </main>
  );
}
