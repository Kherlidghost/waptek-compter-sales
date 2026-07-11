import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { ProductExplorer } from "@/components/ProductExplorer";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { SignedOutToast } from "@/components/SignedOutToast";
import { getStorefrontCatalog } from "@/lib/catalog";
import { branches, categories, products } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

const categoryIcons: Record<string, string> = {
  Laptops: "💻",
  "Desktop Computers": "🖥️",
  Printers: "🖨️",
  "Computer Accessories": "🖱️",
  "Networking Equipment": "📡",
  "Storage Devices": "💾",
  "Repair Services": "🔧",
  Software: "📀",
};

const trustPoints = [
  {
    icon: "✓",
    title: "Verified Vendors",
    body: "Every seller is reviewed and approved before listing products.",
  },
  {
    icon: "✓",
    title: "Receipt-Confirmed Payments",
    body: "Orders only move forward after a cashier reviews your payment proof.",
  },
  {
    icon: "✓",
    title: "Branch-Supported Service",
    body: "Physical support across Adamawa, Yobe, and Borno.",
  },
  {
    icon: "✓",
    title: "Professional Repairs",
    body: "Request computer diagnosis and repair from certified technicians.",
  },
  {
    icon: "✓",
    title: "Genuine Products",
    body: "Laptops, desktops, accessories, and components from trusted sources.",
  },
  {
    icon: "✓",
    title: "Customer Support",
    body: "Reach us by phone, email, or WhatsApp for order and repair help.",
  },
];

const howItWorks = [
  { step: "1", title: "Browse Products", body: "Search laptops, desktops, accessories, and repair services." },
  { step: "2", title: "Add to Cart", body: "Select items and proceed to checkout when ready." },
  { step: "3", title: "Pay to Company Account", body: "Transfer payment to the WAPTEK bank account." },
  { step: "4", title: "Upload Receipt", body: "Submit your payment receipt through the checkout form." },
  { step: "5", title: "Cashier Confirms", body: "A cashier reviews and confirms your payment." },
  { step: "6", title: "Order Processed", body: "Your order is prepared and ready for pickup." },
];

const repairServices = [
  { title: "Screen Replacement", desc: "Cracked or dead display? We replace laptop and desktop screens." },
  { title: "Board Repair", desc: "Motherboard faults, power issues, and component-level repairs." },
  { title: "Software & OS", desc: "Windows installation, virus removal, and system recovery." },
  { title: "Diagnostics", desc: "Full hardware check with written estimate before any repair." },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ signed_out?: string }>;
}) {
  const params = await searchParams;
  const catalog = await getStorefrontCatalog();
  const catalogProducts = catalog.products.length > 0 ? catalog.products : products;
  const catalogCategories = catalog.categories.length > 0 ? catalog.categories : categories;
  const catalogBranches = catalog.branches.length > 0 ? catalog.branches : branches;
  const featuredProducts = catalogProducts.filter((p) => p.featured).slice(0, 6);
  const newArrivals = catalogProducts.slice(0, 6);

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <SignedOutToast show={params.signed_out === "1"} />
      <PublicHeader />

      <main>
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 18% 12%, rgba(16,185,129,0.30), transparent 34rem), radial-gradient(circle at 82% 0%, rgba(59,130,246,0.14), transparent 28rem)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="inline-block rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-200">
                  Sales of Computers &amp; Repairs
                </span>
                <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Computers, Accessories, and Professional Repair Services You Can Trust.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                  Shop quality computer products from WAPTEK and verified vendors, or request expert computer repair support.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="rounded-lg bg-emerald-500 px-7 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400 focus-visible:outline-emerald-400"
                  >
                    Shop Now
                  </Link>
                  <Link
                    href="/repairs"
                    className="rounded-lg border border-white/25 px-7 py-3.5 text-sm font-black transition hover:bg-white/10 focus-visible:outline-white"
                  >
                    Request Repair
                  </Link>
                  <Link
                    href="/become-a-vendor"
                    className="rounded-lg border border-white/25 px-7 py-3.5 text-sm font-black transition hover:bg-white/10 focus-visible:outline-white"
                  >
                    Become a Vendor
                  </Link>
                </div>
              </div>

              {/* Trust cards */}
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                {[
                  { title: "Verified Vendors", body: "Products from approved sellers only." },
                  { title: "Receipt-Confirmed", body: "Orders confirmed after payment review." },
                  { title: "Branch Support", body: "Adamawa, Yobe, and Borno." },
                  { title: "Repair Services", body: "Professional computer diagnosis." },
                ].map((card) => (
                  <div key={card.title} className="rounded-xl bg-white p-4 text-slate-950 shadow-lg">
                    <p className="text-sm font-black">{card.title}</p>
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">{card.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <section className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <p className="section-eyebrow mb-1">Find computer products</p>
            <h2 className="mb-5 text-2xl font-black text-slate-950">Search the marketplace</h2>
            <ProductExplorer
              branches={catalogBranches}
              categories={catalogCategories}
              compact
              products={catalogProducts}
            />
          </div>
        </section>

        {/* ── Featured categories ───────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-eyebrow mb-1">Shop by category</p>
              <h2 className="text-2xl font-black text-slate-950">Computer products and services</h2>
            </div>
            <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" href="/categories">
              View all categories →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {catalogCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="wcs-card group flex flex-col gap-3 rounded-2xl p-5 hover:border-emerald-300 focus-visible:outline-emerald-600"
              >
                <span className="text-3xl" aria-hidden="true">
                  {categoryIcons[category.name] ?? "📦"}
                </span>
                <div>
                  <p className="font-black text-slate-950 group-hover:text-emerald-700">{category.name}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured products ─────────────────────────────────────────── */}
        {featuredProducts.length > 0 ? (
          <section className="bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="section-eyebrow mb-1">Featured stock</p>
                  <h2 className="text-2xl font-black text-slate-950">Ready-to-buy products</h2>
                </div>
                <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" href="/products">
                  View all products →
                </Link>
              </div>
              <ProductGrid products={featuredProducts} />
            </div>
          </section>
        ) : null}

        {/* ── New arrivals ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="section-eyebrow mb-1">New arrivals</p>
              <h2 className="text-2xl font-black text-slate-950">Latest marketplace listings</h2>
            </div>
            <Link className="text-sm font-bold text-emerald-700 hover:text-emerald-900" href="/products">
              Browse all →
            </Link>
          </div>
          <ProductGrid products={newArrivals} />
        </section>

        {/* ── Why WAPTEK ───────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="section-eyebrow mb-1">Why choose us</p>
              <h2 className="text-2xl font-black text-slate-950">Why Shop with WAPTEK COMPUTER SERVICES?</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.title} className="wcs-card rounded-2xl p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">
                    {point.icon}
                  </div>
                  <p className="font-black text-slate-950">{point.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{point.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Repair services ───────────────────────────────────────────── */}
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="section-eyebrow mb-2 text-emerald-300">Repair services</p>
                <h2 className="text-3xl font-black">Professional Computer Repair Support</h2>
                <p className="mt-4 leading-7 text-slate-300">
                  Bring your device to the nearest WAPTEK branch or submit a repair request online. Our technicians handle screen replacements, board repairs, software issues, and full diagnostics.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/repairs"
                    className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                  >
                    Request Repair
                  </Link>
                  <Link
                    href="/contact"
                    className="rounded-lg border border-white/25 px-6 py-3 text-sm font-black transition hover:bg-white/10"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {repairServices.map((service) => (
                  <div key={service.title} className="rounded-xl border border-white/10 bg-white/8 p-5 backdrop-blur">
                    <p className="font-black text-white">{service.title}</p>
                    <p className="mt-1.5 text-sm leading-6 text-slate-300">{service.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl">
            <p className="section-eyebrow mb-1">Simple ordering</p>
            <h2 className="text-2xl font-black text-slate-950">How It Works</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {howItWorks.map((item) => (
              <div key={item.step} className="wcs-card rounded-2xl p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">
                  {item.step}
                </div>
                <p className="font-black text-slate-950">{item.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust & safety ────────────────────────────────────────────── */}
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="mb-8 max-w-2xl">
              <p className="section-eyebrow mb-1">Trust &amp; safety</p>
              <h2 className="text-2xl font-black text-slate-950">Built for Safer Computer Buying</h2>
              <p className="mt-3 leading-7 text-slate-600">
                WAPTEK COMPUTER SERVICES adds review steps before orders move forward, reducing fake listings and payment confusion.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Customers pay to the company bank account.",
                "Customers upload payment receipts.",
                "Cashiers confirm payment before order processing.",
                "Vendors are verified before selling.",
              ].map((item) => (
                <div key={item} className="wcs-card rounded-2xl p-5">
                  <div className="mb-3 h-2 w-8 rounded-full bg-emerald-500" aria-hidden="true" />
                  <p className="text-sm font-bold leading-6 text-slate-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Vendor CTA ────────────────────────────────────────────────── */}
        <section className="bg-slate-900 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-2xl">
              <p className="section-eyebrow mb-2 text-emerald-300">For vendors</p>
              <h2 className="text-2xl font-black">Sell Your Computer Products on WAPTEK COMPUTER SERVICES</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Join our verified vendor network and reach customers looking for computers, accessories, and repair-related products across Adamawa, Yobe, and Borno.
              </p>
            </div>
            <Link
              href="/become-a-vendor"
              className="w-fit shrink-0 rounded-lg bg-emerald-500 px-7 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
            >
              Become a Vendor
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
