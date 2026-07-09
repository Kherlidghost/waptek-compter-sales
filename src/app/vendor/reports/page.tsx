import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { ReportsDashboard } from "@/components/ReportsDashboard";

export const dynamic = "force-dynamic";

export default async function VendorReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="vendor" />
      <ReportsDashboard role="vendor" searchParams={await searchParams} />
    </main>
  );
}
