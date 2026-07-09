import type { Branch, BranchState, Category, Product } from "@/lib/types";
import { branches as seedBranches, categories as seedCategories, products as seedProducts } from "@/lib/marketplace-data";
import { supabaseConfig } from "@/lib/supabase-config";
import { createClient } from "@/lib/supabase/server";

type JoinedOne<T> = T | T[] | null;

type CatalogProductRow = {
  id: string;
  vendor_id: string;
  category_id: string;
  branch_id: string;
  name: string;
  slug: string;
  sku: string | null;
  brand: string | null;
  description: string;
  specifications: string | null;
  price: string | number;
  discount_price: string | number | null;
  warranty: string | null;
  condition: Product["condition"];
  featured: boolean | null;
  categories: JoinedOne<{ name: string; slug: string }>;
  branches: JoinedOne<{ name: string; state: BranchState; city: string }>;
  vendors: JoinedOne<{ business_name: string }>;
  product_images: Array<{ storage_path: string; is_primary: boolean }> | null;
  inventory: Array<{ quantity: number; status?: "active" | "damaged" | "archived" }> | null;
};

type CatalogCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type CatalogBranchRow = {
  id: string;
  name: string;
  state: BranchState;
  city: string;
  manager_profile_id?: string | null;
};

function first<T>(value: JoinedOne<T>) {
  return Array.isArray(value) ? value[0] : value;
}

function stateToId(state: string) {
  return state.toLowerCase();
}

function publicProductImageUrl(storagePath?: string) {
  if (!storagePath) return seedProducts[0].image;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return seedProducts[0].image;

  return `${supabaseUrl}/storage/v1/object/public/${supabaseConfig.storageBuckets.productImages}/${storagePath}`;
}

function mapProduct(row: CatalogProductRow): Product {
  const category = first(row.categories);
  const branch = first(row.branches);
  const vendor = first(row.vendors);
  const primaryImage = row.product_images?.find((image) => image.is_primary) ?? row.product_images?.[0];
  const stock = row.inventory?.filter((item) => item.status !== "archived").reduce((sum, item) => sum + Number(item.quantity ?? 0), 0) ?? 0;

  return {
    id: row.id,
    vendorId: row.vendor_id,
    categoryId: category?.slug ?? row.category_id,
    branchId: branch?.state ? stateToId(branch.state) : row.branch_id,
    name: row.name,
    slug: row.slug,
    sku: row.sku ?? undefined,
    brand: row.brand ?? undefined,
    description: row.description,
    specifications: row.specifications ?? undefined,
    price: Number(row.discount_price ?? row.price),
    discountPrice: row.discount_price === null ? null : Number(row.discount_price),
    warranty: row.warranty,
    condition: row.condition,
    status: "active",
    stock,
    image: publicProductImageUrl(primaryImage?.storage_path),
    specs: row.specifications?.split("\n").map((item) => item.trim()).filter(Boolean) ?? [],
    featured: Boolean(row.featured),
    categoryName: category?.name,
    branchName: branch?.name,
    branchState: branch?.state,
    branchCity: branch?.city,
    vendorName: vendor?.business_name,
  };
}

function mapCategory(row: CatalogCategoryRow): Category {
  return {
    id: row.slug,
    name: row.name,
    description: row.description ?? "Marketplace category.",
  };
}

function mapBranch(row: CatalogBranchRow): Branch {
  return {
    id: stateToId(row.state),
    name: row.name,
    state: row.state,
    city: row.city,
    manager: "Branch manager",
  };
}

export async function getStorefrontCatalog() {
  try {
    const supabase = await createClient();
    const [{ data: productRows, error: productsError }, { data: categoryRows }, { data: branchRows }] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, vendor_id, category_id, branch_id, name, slug, sku, brand, description, specifications, price, discount_price, warranty, condition, featured, categories(name, slug), branches(name, state, city), vendors(business_name), product_images(storage_path, is_primary), inventory(quantity, status)",
        )
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, slug, description").order("name"),
      supabase.from("branches").select("id, name, state, city").order("state"),
    ]);

    if (productsError || !productRows || productRows.length === 0) {
      return {
        products: seedProducts,
        categories: seedCategories,
        branches: seedBranches,
        source: "seed" as const,
      };
    }

    return {
      products: (productRows as unknown as CatalogProductRow[]).map(mapProduct),
      categories: categoryRows && categoryRows.length > 0 ? (categoryRows as CatalogCategoryRow[]).map(mapCategory) : seedCategories,
      branches: branchRows && branchRows.length > 0 ? (branchRows as CatalogBranchRow[]).map(mapBranch) : seedBranches,
      source: "database" as const,
    };
  } catch {
    return {
      products: seedProducts,
      categories: seedCategories,
      branches: seedBranches,
      source: "seed" as const,
    };
  }
}

export async function getStorefrontProduct(slug: string) {
  const catalog = await getStorefrontCatalog();
  return {
    ...catalog,
    product: catalog.products.find((product) => product.slug.toLowerCase() === slug.toLowerCase()) ?? null,
  };
}
