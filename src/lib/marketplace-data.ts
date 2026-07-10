import type { Branch, Category, Notification, Order, Product, RepairRequest, Vendor } from "./types";

export const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

export const branches: Branch[] = [
  { id: "adamawa", name: "Yola Main Branch", state: "Adamawa", city: "Yola", manager: "Amina Bello" },
  { id: "yobe", name: "Damaturu Service Hub", state: "Yobe", city: "Damaturu", manager: "Musa Lawan" },
  { id: "borno", name: "Maiduguri Sales Office", state: "Borno", city: "Maiduguri", manager: "Zainab Ali" },
];

export const categories: Category[] = [
  { id: "laptops", name: "Laptops", description: "Business, student, gaming, and workstation laptops." },
  { id: "desktops", name: "Desktop Computers", description: "Office desktops, mini PCs, workstations, and custom builds." },
  { id: "printers", name: "Printers", description: "Office printers, ink systems, toners, and print accessories." },
  { id: "accessories", name: "Computer Accessories", description: "Chargers, keyboards, mice, bags, RAM, SSDs, and monitors." },
  { id: "networking-equipment", name: "Networking Equipment", description: "Routers, switches, cables, Wi-Fi devices, and network tools." },
  { id: "storage-devices", name: "Storage Devices", description: "Hard drives, SSDs, flash drives, memory cards, and backup storage." },
  { id: "software", name: "Software", description: "Operating systems, productivity tools, security software, and setup support." },
  { id: "repairs", name: "Repair Services", description: "Diagnostics, screen replacement, board repair, and software fixes." },
];

export const vendors: Vendor[] = [
  { id: "vendor-1", businessName: "NorthTech Gadgets", ownerName: "Ibrahim Sani", branchId: "adamawa", status: "approved", rating: 4.7, productsCount: 18 },
  { id: "vendor-2", businessName: "Sahel Computer Hub", ownerName: "Hauwa Garba", branchId: "borno", status: "approved", rating: 4.5, productsCount: 12 },
  { id: "vendor-3", businessName: "Yobe Systems", ownerName: "Abubakar Saleh", branchId: "yobe", status: "pending", rating: 0, productsCount: 0 },
];

export const products: Product[] = [
  {
    id: "prod-1",
    vendorId: "vendor-1",
    categoryId: "laptops",
    branchId: "adamawa",
    name: "HP EliteBook 840 G6",
    slug: "hp-elitebook-840-g6",
    description: "Reliable UK-used business laptop for students, offices, and field teams.",
    price: 285000,
    condition: "UK Used",
    stock: 9,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
    specs: ["Core i5 8th Gen", "8GB RAM", "256GB SSD", "14 inch display"],
    featured: true,
  },
  {
    id: "prod-2",
    vendorId: "vendor-2",
    categoryId: "laptops",
    branchId: "borno",
    name: "Dell Latitude 5410",
    slug: "dell-latitude-5410",
    description: "Clean refurbished Dell laptop with warranty-ready stock tracking.",
    price: 330000,
    condition: "Refurbished",
    stock: 5,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
    specs: ["Core i5 10th Gen", "16GB RAM", "512GB SSD", "Backlit keyboard"],
  },
  {
    id: "prod-3",
    vendorId: "vendor-1",
    categoryId: "accessories",
    branchId: "adamawa",
    name: "Logitech Wireless Keyboard and Mouse",
    slug: "logitech-wireless-keyboard-mouse",
    description: "Durable wireless combo for home and office setups.",
    price: 28500,
    condition: "New",
    stock: 32,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    specs: ["2.4GHz receiver", "Full-size keyboard", "12-month battery life"],
    featured: true,
  },
  {
    id: "prod-4",
    vendorId: "vendor-2",
    categoryId: "desktops",
    branchId: "borno",
    name: "Lenovo ThinkCentre M720q",
    slug: "lenovo-thinkcentre-m720q",
    description: "Compact desktop for POS, accounting, cyber cafe, and admin counters.",
    price: 210000,
    condition: "UK Used",
    stock: 7,
    image: "https://images.unsplash.com/photo-1593640495253-23196b27a87f?auto=format&fit=crop&w=900&q=80",
    specs: ["Core i5", "8GB RAM", "256GB SSD", "Tiny form factor"],
  },
  {
    id: "prod-5",
    vendorId: "vendor-1",
    categoryId: "accessories",
    branchId: "yobe",
    name: "Samsung 24 inch Monitor",
    slug: "samsung-24-inch-monitor",
    description: "Full HD monitor for office setups and repair bench diagnostics.",
    price: 95000,
    condition: "New",
    stock: 14,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
    specs: ["24 inch", "1080p", "HDMI/VGA", "Eye saver mode"],
  },
  {
    id: "prod-6",
    vendorId: "vendor-2",
    categoryId: "repairs",
    branchId: "borno",
    name: "Laptop Diagnostic Service",
    slug: "laptop-diagnostic-service",
    description: "Book a technician check for power, display, charging, overheating, or software faults.",
    price: 10000,
    condition: "New",
    stock: 50,
    image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=900&q=80",
    specs: ["Same-day triage", "Written estimate", "Branch handoff"],
  },
];

export const orders: Order[] = [
  {
    id: "ORD-2407-001",
    customerName: "Fatima Ahmed",
    branchId: "adamawa",
    status: "receipt_uploaded",
    total: 313500,
    receiptStatus: "pending",
    createdAt: "2026-07-07",
    items: [
      { productId: "prod-1", quantity: 1, price: 285000 },
      { productId: "prod-3", quantity: 1, price: 28500 },
    ],
  },
  {
    id: "ORD-2407-002",
    customerName: "Daniel Yakubu",
    branchId: "borno",
    status: "paid_approved",
    total: 210000,
    receiptStatus: "confirmed",
    createdAt: "2026-07-06",
    items: [{ productId: "prod-4", quantity: 1, price: 210000 }],
  },
];

export const notifications: Notification[] = [
  {
    id: "note-1",
    channel: "email",
    recipient: "customer@example.local",
    message: "Order ORD-2407-001 received. Please upload bank transfer receipt.",
    status: "sent_simulated",
  },
  {
    id: "note-2",
    channel: "whatsapp",
    recipient: "+234 800 000 0000",
    message: "Support draft: Hello, I need help with order ORD-2407-001.",
    status: "queued",
  },
];

export const repairRequests: RepairRequest[] = [
  {
    id: "REP-2407-001",
    customerName: "Fatima Ahmed",
    customerPhone: "+2348000000005",
    branchId: "adamawa",
    deviceModel: "HP EliteBook 840 G6",
    faultDescription: "Laptop powers on but the screen flickers after a few minutes.",
    status: "new",
    createdAt: "2026-07-07",
  },
  {
    id: "REP-2407-002",
    customerName: "Daniel Yakubu",
    customerPhone: "+2348000000006",
    branchId: "borno",
    deviceModel: "Lenovo ThinkCentre M720q",
    faultDescription: "Desktop is overheating and shutting down during use.",
    status: "diagnosing",
    estimatedCost: 18000,
    createdAt: "2026-07-06",
  },
];

export function getBranch(id: string) {
  return branches.find((branch) => branch.id === id);
}

export function getVendor(id: string) {
  return vendors.find((vendor) => vendor.id === id);
}

export function getCategory(id: string) {
  return categories.find((category) => category.id === id);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export const dashboardStats = {
  revenue: orders.reduce((sum, order) => sum + order.total, 0),
  pendingReceipts: orders.filter((order) => order.receiptStatus === "pending").length,
  approvedVendors: vendors.filter((vendor) => vendor.status === "approved").length,
  inventoryUnits: products.reduce((sum, product) => sum + product.stock, 0),
};
