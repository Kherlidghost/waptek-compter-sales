import { AdminManagerDashboard } from "@/components/AdminManagerDashboard";
import { OnlineOrderStatusPanel } from "@/components/OnlineOrderStatusPanel";

export default function ManagerDashboardPage() {
  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <OnlineOrderStatusPanel role="manager" />
      <AdminManagerDashboard role="manager" />
    </main>
  );
}
