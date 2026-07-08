"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { branches as seedBranches, categories as seedCategories, products as seedProducts } from "@/lib/marketplace-data";
import type { Branch, Category, Product } from "@/lib/types";

const conditions = ["New", "UK Used", "Refurbished"] as const;

type SortOption = "featured" | "price-low" | "price-high" | "stock-high";

type ProductExplorerProps = {
  initialCategoryId?: string;
  compact?: boolean;
  products?: Product[];
  categories?: Category[];
  branches?: Branch[];
};

export function ProductExplorer({
  initialCategoryId = "all",
  compact = false,
  products = seedProducts,
  categories = seedCategories,
  branches = seedBranches,
}: ProductExplorerProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [branchId, setBranchId] = useState("all");
  const [condition, setCondition] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");

  const filteredProducts = useMemo(() => {
    const parsedMaxPrice = Number(maxPrice);
    const hasMaxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0;

    const matches = products.filter((product) => {
      const matchesQuery = `${product.name} ${product.description} ${product.condition}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
      const matchesBranch = branchId === "all" || product.branchId === branchId;
      const matchesCondition = condition === "all" || product.condition === condition;
      const matchesPrice = !hasMaxPrice || product.price <= parsedMaxPrice;
      const matchesStock = !inStockOnly || product.stock > 0;
      return matchesQuery && matchesCategory && matchesBranch && matchesCondition && matchesPrice && matchesStock;
    });

    return [...matches].sort((first, second) => {
      if (sort === "price-low") return first.price - second.price;
      if (sort === "price-high") return second.price - first.price;
      if (sort === "stock-high") return second.stock - first.stock;
      return Number(second.featured ?? false) - Number(first.featured ?? false);
    });
  }, [branchId, categoryId, condition, inStockOnly, maxPrice, products, query, sort]);

  return (
    <section className={compact ? "w-full" : "mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"}>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search laptops, accessories, repairs"
          className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600"
        />
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        >
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={branchId}
          onChange={(event) => setBranchId(event.target.value)}
          className="h-11 rounded-md border border-slate-300 px-3 text-sm"
        >
          <option value="all">All branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.state}
            </option>
          ))}
        </select>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[180px_180px_190px_1fr]">
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          >
            <option value="all">All conditions</option>
            {conditions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            inputMode="numeric"
            placeholder="Max price"
            className="h-11 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-emerald-600"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="h-11 rounded-md border border-slate-300 px-3 text-sm"
          >
            <option value="featured">Featured first</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="stock-high">Stock: high to low</option>
          </select>
          <label className="flex h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm">
            <input
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              type="checkbox"
              className="size-4 accent-emerald-700"
            />
            In stock only
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <p>
          Showing <span className="font-bold text-slate-950">{filteredProducts.length}</span> of {products.length} products
        </p>
        <button
          onClick={() => {
            setQuery("");
            setCategoryId("all");
            setBranchId("all");
            setCondition("all");
            setMaxPrice("");
            setInStockOnly(false);
            setSort("featured");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 font-semibold hover:bg-white"
          type="button"
        >
          Reset filters
        </button>
      </div>

      <div className="mt-6">
        <ProductGrid products={filteredProducts} />
      </div>
    </section>
  );
}
