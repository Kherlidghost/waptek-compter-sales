import Link from "next/link";
import { PublicHeader } from "@/components/PublicHeader";

const accounts = [
  ["Admin", "admin@computermarket.local", "/admin"],
  ["Manager", "manager@computermarket.local", "/manager"],
  ["Cashier", "cashier@computermarket.local", "/cashier"],
  ["Vendor", "vendor@computermarket.local", "/vendor"],
  ["Customer", "customer@computermarket.local", "/products"],
];

const testFlow = [
  ["Browse marketplace", "Start at the homepage, then open categories, products, search, filters, and a product details page.", "/products"],
  ["Customer checkout", "Open cart and checkout, upload a sample receipt, submit the order, and confirm the in-app notification.", "/checkout"],
  ["Cashier receipt review", "Open the cashier dashboard, view a pending receipt image, then confirm or reject payment.", "/cashier"],
  ["Admin operations", "Approve vendors, manage products/categories/branches/orders/inventory, and review analytics and notification logs.", "/admin"],
  ["Vendor workflow", "Add or edit a product, review own products, product orders, and inventory status.", "/vendor"],
  ["Repair request", "Submit a public repair request, then check submitted requests from staff dashboards.", "/repairs"],
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase text-emerald-700">Local demo guide</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">How to test the CompuMarket NG POC</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Use this page as a live checklist for the buyer, vendor, cashier, admin, manager, payment confirmation, repair request, and simulated notification workflows.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700" href="/login">
              Open login
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold hover:bg-slate-50" href="/products">
              Browse products
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Demo accounts</h2>
            <p className="mt-2 text-sm text-slate-600">All accounts use password `Password123!`.</p>
            <div className="mt-5 grid gap-3">
              {accounts.map(([role, email, route]) => (
                <div key={email} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-950">{role}</p>
                      <p className="mt-1 text-sm text-slate-600">{email}</p>
                    </div>
                    <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50" href={route}>
                      Open
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Test flow</h2>
            <div className="mt-5 grid gap-3">
              {testFlow.map(([title, description, route], index) => (
                <article key={title} className="rounded-md border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold uppercase text-emerald-700">Step {index + 1}</p>
                      <h3 className="mt-1 font-black text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                    <Link className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold hover:bg-slate-50" href={route}>
                      Go
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Payment and notification checks</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {[
              ["Manual transfer", "Checkout uses receipt upload only. No Paystack or Flutterwave call is made."],
              ["Cashier approval", "Confirming payment moves the order to paid approved in the local cashier view."],
              ["Simulated messages", "Order and payment events write email, WhatsApp, and dashboard messages to local logs."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-md bg-slate-50 p-4">
                <p className="font-bold text-slate-950">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
