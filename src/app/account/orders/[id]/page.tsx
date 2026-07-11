import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AccountOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/orders/${encodeURIComponent(id)}`);
}

