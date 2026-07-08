import { reviewPayment } from "@/app/cashier/actions";
import { CashierDashboard, type CashierOrder } from "@/components/CashierDashboard";
import { DashboardSessionBar } from "@/components/DashboardSessionBar";
import { orders } from "@/lib/marketplace-data";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

type ReceiptRow = {
  id: string;
  storage_path: string;
  status: "pending" | "confirmed" | "rejected";
  review_note: string | null;
};

type OnlineOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  branch_id: string;
  status: CashierOrder["status"];
  total: number | string;
  created_at: string;
  payment_receipts: ReceiptRow[];
};

async function getOnlineReceiptOrders(): Promise<CashierOrder[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, branch_id, status, total, created_at, payment_receipts(id, storage_path, status, review_note)")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error || !data) return orders;

    return Promise.all(
      (data as OnlineOrderRow[]).map(async (order) => {
        const receipt = order.payment_receipts?.[0];
        let receiptUrl: string | undefined;

        if (receipt?.storage_path) {
          const { data: signed } = await supabase.storage
            .from(supabaseConfig.storageBuckets.paymentReceipts)
            .createSignedUrl(receipt.storage_path, 60 * 10);
          receiptUrl = signed?.signedUrl;
        }

        return {
          dbId: order.id,
          receiptId: receipt?.id,
          receiptUrl,
          id: order.order_number,
          customerName: order.customer_name,
          branchId: order.branch_id,
          status: order.status,
          total: Number(order.total),
          receiptStatus: receipt?.status ?? "pending",
          createdAt: new Date(order.created_at).toLocaleDateString("en-NG"),
          reviewNote: receipt?.review_note ?? "Awaiting cashier review",
          items: [],
        };
      }),
    );
  } catch {
    return orders;
  }
}

export default async function CashierDashboardPage() {
  const onlineOrders = await getOnlineReceiptOrders();

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <DashboardSessionBar role="cashier" />
      <CashierDashboard initialOrders={onlineOrders} reviewAction={reviewPayment} />
    </main>
  );
}
