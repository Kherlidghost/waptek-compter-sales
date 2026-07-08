import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { ProductExplorer } from "@/components/ProductExplorer";
import { PublicHeader } from "@/components/PublicHeader";
import { getStorefrontCatalog } from "@/lib/catalog";
import { branches, categories, dashboardStats, formatNaira, products } from "@/lib/marketplace-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await getStorefrontCatalog();
  const catalogProducts = catalog.products.length > 0 ? catalog.products : products;
  const catalogCategories = catalog.categories.length > 0 ? catalog.categories : categories;
  const catalogBranches = catalog.branches.length > 0 ? catalog.branches : branches;
  const featuredProducts = catalogProducts.filter((product) => product.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />

      <main>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Local POC · Nigeria computer marketplace</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
                Multi-vendor computer sales, accessories, repair requests, and manual bank transfer orders.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Approved vendors upload products, buyers order locally, cashiers confirm uploaded receipts, and managers track branch performance across Adamawa, Yobe, and Borno.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="rounded-md bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400" href="/products">
                  Browse products
                </Link>
                <Link className="rounded-md border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10" href="/categories">
                  Browse categories
                </Link>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg bg-white/10 p-4">
              {[
                ["Branches", catalogBranches.length.toString()],
                ["Live stock units", catalogProducts.reduce((sum, product) => sum + product.stock, 0).toString()],
                ["POC revenue", formatNaira(dashboardStats.revenue)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md bg-white p-4 text-slate-950">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
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
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md"
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

        <div id="marketplace">
          <ProductExplorer branches={catalogBranches} categories={catalogCategories} products={catalogProducts} />
        </div>
      </main>
    </div>
  );
}
