"use client";

import { useMemo, useState } from "react";
import { ProductGrid } from "@/components/ProductCard";
import { branches as seedBranches, categories as seedCategories, products as seedProducts } from "@/lib/marketplace-data";
import type { Branch, Category, Product } from "@/lib/types";

const conditions = ["New", "UK Used", "Refurbished"] as const;
const categoryChips = ["Laptops", "Desktops", "Accessories", "Printers", "Repair Tools", "Components"];

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
  const [categoryChip, setCategoryChip] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [condition, setCondition] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");

  const filteredProducts = useMemo(() => {
    const parsedMaxPrice = Number(maxPrice);
    const hasMaxPrice = Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0;
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedChip = categoryChip.toLowerCase();

    const matches = products.filter((product) => {
      const category = categories.find((item) => item.id === product.categoryId || item.name === product.categoryName);
      const categoryName = product.categoryName ?? category?.name ?? "";
      const vendorName = product.vendorName ?? "";
      const searchableText = `${product.name} ${categoryName} ${vendorName} ${product.description ?? ""}`.toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
      const matchesCategory = categoryId === "all" || product.categoryId === categoryId;
      const matchesChip =
        !normalizedChip ||
        categoryName.toLowerCase().includes(normalizedChip) ||
        (normalizedChip === "repair tools" && categoryName.toLowerCase().includes("repair"));
      const matchesBranch = branchId === "all" || product.branchId === branchId;
      const matchesCondition = condition === "all" || product.condition === condition;
      const matchesPrice = !hasMaxPrice || product.price <= parsedMaxPrice;
      const matchesStock = !inStockOnly || product.stock > 0;
      return matchesQuery && matchesCategory && matchesChip && matchesBranch && matchesCondition && matchesPrice && matchesStock;
    });

    return [...matches].sort((first, second) => {
      if (sort === "price-low") return first.price - second.price;
      if (sort === "price-high") return second.price - first.price;
      if (sort === "stock-high") return second.stock - first.stock;
      return Number(second.featured ?? false) - Number(first.featured ?? false);
    });
  }, [branchId, categories, categoryChip, categoryId, condition, inStockOnly, maxPrice, products, query, sort]);

  const activeCategoryName =
    (categoryId !== "all" ? categories.find((category) => category.id === categoryId)?.name : categoryChip) ?? "";
  const categoryHasNoProducts =
    Boolean(activeCategoryName) &&
    products.every((product) => {
      const category = categories.find((item) => item.id === product.categoryId || item.name === product.categoryName);
      const categoryName = product.categoryName ?? category?.name ?? "";
      return !categoryName.toLowerCase().includes(activeCategoryName.toLowerCase());
    });

  return (
    <section className={compact ? "w-full" : "mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"}>
      <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-950/5 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search laptops, desktops, accessories, repair tools…"
          className="h-12 rounded-lg border border-slate-300 px-4 text-sm font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setCategoryChip("");
          }}
          className="h-12 rounded-lg border border-slate-300 px-3 text-sm font-medium"
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
          className="h-12 rounded-lg border border-slate-300 px-3 text-sm font-medium"
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
            className="h-12 rounded-lg border border-slate-300 px-3 text-sm font-medium"
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
            className="h-12 rounded-lg border border-slate-300 px-4 text-sm font-medium outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="h-12 rounded-lg border border-slate-300 px-3 text-sm font-medium"
          >
            <option value="featured">Featured first</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="stock-high">Stock: high to low</option>
          </select>
          <label className="flex h-12 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium">
            <input
              checked={inStockOnly}
              onChange={(event) => setInStockOnly(event.target.checked)}
              type="checkbox"
              className="size-4 accent-emerald-700"
            />
            In stock only
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {categoryChips.map((chip) => (
            <button
              key={chip}
              className={`rounded-full border px-4 py-2 text-sm font-bold shadow-sm ${
                categoryChip === chip
                  ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
              }`}
              onClick={() => {
                setCategoryChip(categoryChip === chip ? "" : chip);
                setCategoryId("all");
              }}
              type="button"
            >
              {chip}
            </button>
          ))}
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
            setCategoryChip("");
            setBranchId("all");
            setCondition("all");
            setMaxPrice("");
            setInStockOnly(false);
            setSort("featured");
          }}
          className="rounded-lg border border-slate-300 bg-white/80 px-4 py-2 font-bold hover:bg-white"
          type="button"
        >
          Reset filters
        </button>
      </div>

      <div className="mt-6">
        <ProductGrid
          emptyMessage={categoryHasNoProducts ? "This category has no products yet." : "No products found. Try another search or category."}
          products={filteredProducts}
        />
      </div>
    </section>
  );
}
