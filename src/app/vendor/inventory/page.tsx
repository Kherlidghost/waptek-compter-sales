import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { InventoryManagementPage } from "@/components/InventoryManagementPage";

export const dynamic = "force-dynamic";

export default async function VendorInventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <main className="min-h-screen space-y-6 dashboard-shell px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="vendor" />
      <InventoryManagementPage role="vendor" searchParams={await searchParams} />
    </main>
  );
}
