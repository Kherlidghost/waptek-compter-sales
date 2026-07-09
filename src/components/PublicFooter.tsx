import Link from "next/link";

const quickLinks = [
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/repairs", label: "Repairs" },
  { href: "/become-a-vendor", label: "Become a Vendor" },
  { href: "/cart", label: "Cart" },
];

const supportLinks = [
  { href: "/contact", label: "Contact Us" },
  { href: "/checkout", label: "Payment Confirmation" },
  { href: "/orders", label: "Order Tracking" },
  { href: "/repairs", label: "Repair Request" },
];

const legalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/returns", label: "Return Policy" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr] lg:px-8">
        <section>
          <h2 className="text-lg font-black">About CompuMarket NG</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Computer marketplace for laptops, desktops, accessories, and repairs across Adamawa, Yobe, and Borno.
          </p>
        </section>

        <FooterLinks title="Quick Links" links={quickLinks} />
        <FooterLinks title="Support" links={supportLinks} />
        <FooterLinks title="Legal" links={legalLinks} />

        <section>
          <h2 className="text-sm font-black uppercase tracking-wide text-emerald-300">Contact</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>WhatsApp: +234 800 000 0000</p>
            <p>Phone: +234 800 000 0001</p>
            <p>
              Email:{" "}
              <a className="font-semibold text-white hover:text-emerald-300" href="mailto:support@compumarket.ng">
                support@compumarket.ng
              </a>
            </p>
            <p>Locations: Adamawa, Yobe, Borno</p>
          </div>
        </section>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-sm text-slate-400">
        © 2026 CompuMarket NG. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <section>
      <h2 className="text-sm font-black uppercase tracking-wide text-emerald-300">{title}</h2>
      <nav className="mt-3 grid gap-2 text-sm">
        {links.map((link) => (
          <Link key={link.href} className="text-slate-300 hover:text-white" href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
