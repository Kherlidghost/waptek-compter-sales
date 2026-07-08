import Link from "next/link";

const navItems = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/orders", label: "Orders" },
  { href: "/repairs", label: "Repairs" },
  { href: "/demo", label: "Demo" },
  { href: "/login", label: "Login" },
  { href: "/dashboard", label: "Dashboard" },
];

export function PublicHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-black text-slate-950">
          CompuMarket NG
        </Link>
        <div className="flex flex-wrap gap-2 text-sm font-semibold">
          {navItems.map((item) => (
            <Link key={item.href} className="rounded-md px-3 py-2 hover:bg-slate-100" href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link className="rounded-md px-3 py-2 hover:bg-slate-100" href="/cart">
            Cart
          </Link>
          <Link className="rounded-md bg-emerald-700 px-3 py-2 text-white hover:bg-emerald-800" href="/checkout">
            Checkout
          </Link>
        </div>
      </nav>
    </header>
  );
}
