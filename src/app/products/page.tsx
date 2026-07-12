import { ProductExplorer } from "@/components/ProductExplorer";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { getStorefrontCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const { products, categories, branches } = await getStorefrontCatalog();
  const category = categories.find((item) => item.id === params.category);

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(16,185,129,0.25),transparent_24rem)]" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="section-eyebrow mb-2 text-emerald-300">
              {category ? category.name : "All products"}
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-white">
              {category
                ? `${category.name} — WAPTEK Marketplace`
                : "Browse All Marketplace Products"}
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Search {products.length} products across Adamawa, Yobe, and Borno. Filter by category, branch, condition, stock, and price.
            </p>
          </div>
        </section>

        <ProductExplorer
          branches={branches}
          categories={categories}
          initialCategoryId={category?.id ?? "all"}
          products={products}
        />
      </main>
      <PublicFooter />
    </div>
  );
}
