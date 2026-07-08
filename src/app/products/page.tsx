import { ProductExplorer } from "@/components/ProductExplorer";
import { PublicHeader } from "@/components/PublicHeader";
import { getStorefrontCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const { products, categories, branches, source } = await getStorefrontCatalog();
  const category = categories.find((item) => item.id === params.category);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-bold uppercase text-emerald-700">Product listing</p>
            <h1 className="mt-2 text-4xl font-black text-slate-950">
              {category ? `${category.name} in the marketplace` : "Browse all marketplace products"}
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              Search {products.length} {source === "database" ? "live" : "demo"} products across Adamawa, Yobe, and Borno. Filter by category, branch, condition, stock, and price.
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
    </div>
  );
}
