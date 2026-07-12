import Link from "next/link";
import { WaptekBrand } from "./WaptekBrand";

const productLinks = [
  { href: "/products?category=laptops", label: "Laptops" },
  { href: "/products?category=desktops", label: "Desktop Computers" },
  { href: "/products?category=printers", label: "Printers" },
  { href: "/products?category=accessories", label: "Accessories" },
  { href: "/products?category=networking-equipment", label: "Networking Equipment" },
  { href: "/products?category=storage-devices", label: "Storage Devices" },
];

const serviceLinks = [
  { href: "/repairs", label: "Request Repair" },
  { href: "/repairs", label: "Repair Services" },
  { href: "/become-a-vendor", label: "Become a Vendor" },
  { href: "/cart", label: "Shopping Cart" },
  { href: "/orders", label: "Order Tracking" },
];

const supportLinks = [
  { href: "/contact", label: "Contact Us" },
  { href: "/about", label: "About WAPTEK" },
  { href: "/checkout", label: "Payment Help" },
];

const legalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/returns", label: "Return Policy" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <section>
            <WaptekBrand theme="dark" className="items-center gap-2.5" />
            <p className="mt-4 text-sm leading-7 text-slate-400">
              Verified computer vendors, genuine products, and professional repair services across Adamawa, Yobe, and Borno.
            </p>
          </section>

          <FooterLinks title="Products" links={productLinks} />
          <FooterLinks title="Services" links={serviceLinks} />
          <FooterLinks title="Support &amp; Legal" links={[...supportLinks, ...legalLinks]} />

          {/* Contact */}
          <section>
            <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-emerald-400">Contact</h2>
            <address className="not-italic space-y-2 text-sm text-slate-400">
              <p>
                <span className="font-semibold text-slate-300">WhatsApp:</span>{" "}
                <a href="https://wa.me/2348000000000" className="hover:text-white">+234 800 000 0000</a>
              </p>
              <p>
                <span className="font-semibold text-slate-300">Phone:</span>{" "}
                <a href="tel:+2348000000001" className="hover:text-white">+234 800 000 0001</a>
              </p>
              <p>
                <span className="font-semibold text-slate-300">Email:</span>{" "}
                <a href="mailto:support@waptekcomputerservices.com" className="hover:text-white">
                  support@waptekcomputerservices.com
                </a>
              </p>
              <p>
                <span className="font-semibold text-slate-300">Locations:</span> Adamawa, Yobe, Borno
              </p>
            </address>
          </section>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} WAPTEK COMPUTER SERVICES. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <section>
      <h2
        className="mb-3 text-xs font-black uppercase tracking-widest text-emerald-400"
        dangerouslySetInnerHTML={{ __html: title }}
      />
      <nav className="grid gap-2 text-sm">
        {links.map((link) => (
          <Link key={`${link.href}-${link.label}`} className="text-slate-400 hover:text-white" href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </section>
  );
}
