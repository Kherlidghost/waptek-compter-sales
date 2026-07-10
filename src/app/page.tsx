import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { ProductExplorer } from "@/components/ProductExplorer";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { SignedOutToast } from "@/components/SignedOutToast";
import { getStorefrontCatalog } from "@/lib/catalog";
import { branches, categories, products } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

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
  const featuredProducts = catalogProducts.filter((product) => product.featured).slice(0, 3);
  const trustCards = [
    {
      title: "Verified Vendors",
      description: "Products are listed by approved sellers.",
    },
    {
      title: "Receipt-Confirmed Payments",
      description: "Orders are processed after payment proof is reviewed.",
    },
    {
      title: "Branch-Supported Service",
      description: "Support across Adamawa, Yobe, and Borno.",
    },
    {
      title: "Repair Support Available",
      description: "Customers can request computer diagnosis and repair.",
    },
  ];
  const reasons = [
    "Verified computer vendors",
    "Genuine computer products and accessories",
    "Manual payment confirmation for safer orders",
    "Repair service support",
    "Branch-supported operations across Adamawa, Yobe, and Borno",
    "Vendor marketplace opportunity",
  ];
  const steps = [
    "Browse products",
    "Add to cart",
    "Pay to company account",
    "Upload receipt",
    "Cashier confirms payment",
    "Order is processed",
  ];

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <SignedOutToast show={params.signed_out === "1"} />
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.28),transparent_32rem),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.16),transparent_28rem)]" />
          <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="w-fit rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-black uppercase tracking-wide text-emerald-200">Nigeria Computer Marketplace</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                Nigeria’s Trusted Marketplace for Computers, Accessories, and Professional Repair Services.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Buy quality laptops, desktops, accessories, and repair services from verified vendors across Adamawa, Yobe, and Borno. Place orders securely with receipt-confirmed payments.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400" href="/products">
                  Browse Products
                </Link>
                <Link className="rounded-lg border border-white/20 px-6 py-3 text-sm font-black hover:bg-white/10" href="/repairs">
                  Request Repair
                </Link>
                <Link className="rounded-lg border border-white/20 px-6 py-3 text-sm font-black hover:bg-white/10" href="/become-a-vendor">
                  Become a Vendor
                </Link>
              </div>
            </div>
            <div className="grid content-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl shadow-slate-950/30 backdrop-blur sm:grid-cols-2">
              {trustCards.map((card) => (
                <div key={card.title} className="rounded-xl bg-white p-5 text-slate-950 shadow-lg shadow-slate-950/10">
                  <p className="text-lg font-black">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-5 max-w-3xl">
              <p className="text-sm font-bold uppercase text-emerald-700">Find computer products</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Search the marketplace</h2>
            </div>
            <ProductExplorer branches={catalogBranches} categories={catalogCategories} compact products={catalogProducts} />
          </div>
        </section>

        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-300">Trust & Safety</p>
              <h2 className="mt-1 text-2xl font-black text-white">Built for Safer Computer Buying</h2>
              <p className="mt-4 leading-7 text-slate-300">
                CompuMarket NG is designed to reduce fake listings and payment confusion by adding review steps before orders move forward.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Customers pay to the company account.",
                "Customers upload payment receipts.",
                "Cashiers confirm payment before order processing.",
                "Vendors are verified before selling.",
              ].map((item) => (
                <div key={item} className="rounded-xl border border-white/10 bg-white/10 p-5 shadow-sm backdrop-blur">
                  <p className="font-bold leading-6 text-white">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase text-emerald-700">Why choose us</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Why Choose CompuMarket NG?</h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reasons.map((reason) => (
                <div key={reason} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="font-bold text-slate-950">{reason}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 max-w-3xl">
            <p className="text-sm font-bold uppercase text-emerald-700">Simple ordering</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">How It Works</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">
                  {index + 1}
                </div>
                <p className="mt-4 font-bold text-slate-950">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-900 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase text-emerald-300">For vendors</p>
              <h2 className="mt-1 text-2xl font-black">Sell Your Computer Products on CompuMarket NG</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Join our verified vendor network and reach customers looking for computers, accessories, and repair-related products.
              </p>
            </div>
            <Link className="w-fit rounded-lg bg-emerald-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-emerald-400" href="/become-a-vendor">
              Become a Vendor
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Shop by category</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Computer products and services</h2>
            </div>
            <Link className="text-sm font-bold text-emerald-800" href="/categories">
              View all categories
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {catalogCategories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md"
              >
                <p className="font-bold text-slate-950">{category.name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-700">Featured stock</p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">Ready-to-buy products</h2>
            </div>
            <Link className="text-sm font-bold text-emerald-800" href="/products">
              View product listing
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>

      </main>
      <PublicFooter />
    </div>
  );
}
