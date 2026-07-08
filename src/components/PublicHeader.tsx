import Link from "next/link";

const navItems = [
  { href: "/categories", label: "Categories" },
  { href: "/products", label: "Products" },
  { href: "/repairs", label: "Repairs" },
  { href: "/login", label: "Login" },
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
        </div>
      </nav>
    </header>
  );
}
