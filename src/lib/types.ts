export type UserRole = "admin" | "manager" | "cashier" | "vendor" | "customer";

export type BranchState = "Adamawa" | "Yobe" | "Borno";

export type VendorStatus = "pending" | "approved" | "rejected" | "suspended" | "inactive";

export type OrderStatus =
  | "awaiting_receipt"
  | "receipt_uploaded"
  | "paid_approved"
  | "processing"
  | "ready_for_pickup"
  | "payment_rejected"
  | "fulfilled"
  | "cancelled";

export type ReceiptStatus = "pending" | "confirmed" | "rejected";

export type RepairStatus = "new" | "diagnosing" | "quoted" | "in_repair" | "ready" | "closed" | "cancelled";

export type Branch = {
  id: string;
  name: string;
  state: BranchState;
  city: string;
  manager: string;
};

export type Vendor = {
  id: string;
  businessName: string;
  ownerName: string;
  branchId: string;
  status: VendorStatus;
  rating: number;
  productsCount: number;
};

export type Category = {
  id: string;
  name: string;
  description: string;
};

export type Product = {
  id: string;
  vendorId: string;
  categoryId: string;
  branchId: string;
  name: string;
  slug: string;
  sku?: string;
  brand?: string;
  description: string;
  specifications?: string;
  price: number;
  discountPrice?: number | null;
  warranty?: string | null;
  condition: "New" | "UK Used" | "Refurbished";
  status?: "draft" | "active" | "inactive" | "archived" | "rejected";
  stock: number;
  image: string;
  specs: string[];
  featured?: boolean;
  categoryName?: string;
  branchName?: string;
  branchState?: BranchState;
  branchCity?: string;
  vendorName?: string;
};

export type Order = {
  id: string;
  customerName: string;
  branchId: string;
  status: OrderStatus;
  total: number;
  receiptStatus: ReceiptStatus;
  createdAt: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
};

export type RepairRequest = {
  id: string;
  customerName: string;
  customerPhone: string;
  branchId: string;
  deviceModel: string;
  faultDescription: string;
  status: RepairStatus;
  estimatedCost?: number;
  createdAt: string;
};

export type Notification = {
  id: string;
  channel: "email" | "whatsapp" | "dashboard";
  recipient: string;
  message: string;
  status: "queued" | "sent_simulated";
};
