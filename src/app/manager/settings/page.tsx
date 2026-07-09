import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { SettingsDashboard } from "@/components/SettingsDashboard";

export const dynamic = "force-dynamic";

export default async function ManagerSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <div className="mx-auto grid max-w-7xl gap-6">
        <DashboardSessionBar role="manager" />
        <SettingsDashboard role="manager" searchParams={params} />
      </div>
    </main>
  );
}
