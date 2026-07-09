import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { OrderManagementPage } from "@/components/OrderManagementPage";

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="vendor" />
      <OrderManagementPage role="vendor" searchParams={await searchParams} />
    </main>
  );
}
