import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { RepairRequestForm } from "@/components/RepairRequestForm";

export default function RepairsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="px-4 py-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Repair service request</h1>
          <p className="mt-2 text-sm text-slate-600">Capture repair jobs locally before assigning them to a branch technician.</p>
          <RepairRequestForm />
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
