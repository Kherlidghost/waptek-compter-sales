import { DesignSurface } from "@/components/DesignSurface";
import { PublicFooter } from "@/components/PublicFooter";
import { PublicHeader } from "@/components/PublicHeader";
import { RepairRequestForm } from "@/components/RepairRequestForm";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { isSupabaseConfigured } from "@/lib/supabase-config";
import { repairInquiryMessage, resolveWhatsAppNumber } from "@/lib/whatsapp";

async function getWhatsAppNumber(): Promise<string | null> {
  try {
    if (!isSupabaseConfigured()) return resolveWhatsAppNumber();
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase
      .from("company_settings")
      .select("whatsapp_number")
      .eq("id", 1)
      .maybeSingle();
    return resolveWhatsAppNumber((data as { whatsapp_number?: string | null } | null)?.whatsapp_number);
  } catch {
    return resolveWhatsAppNumber();
  }
}

const repairServices = [
  { icon: "🖥️", title: "Screen Replacement", desc: "Cracked, flickering, or dead displays on laptops and desktops." },
  { icon: "🔌", title: "Power & Charging", desc: "Won't turn on, battery issues, or charging port faults." },
  { icon: "🧩", title: "Board Repair", desc: "Motherboard faults, component-level diagnosis, and soldering." },
  { icon: "💿", title: "Software & OS", desc: "Windows installation, virus removal, and system recovery." },
  { icon: "🌡️", title: "Overheating", desc: "Fan replacement, thermal paste, and cooling system service." },
  { icon: "🔍", title: "Full Diagnostics", desc: "Complete hardware check with written estimate before any repair." },
];

const repairSteps = [
  { step: "1", title: "Submit Request", body: "Fill the form below or chat on WhatsApp with your device details." },
  { step: "2", title: "Choose Branch", body: "Select the nearest WAPTEK branch in Adamawa, Yobe, or Borno." },
  { step: "3", title: "Bring Device", body: "Drop off your device at the branch for diagnosis." },
  { step: "4", title: "Get Estimate", body: "Receive a written cost estimate before any repair begins." },
  { step: "5", title: "Repair & Pickup", body: "Collect your repaired device once work is complete." },
];

export default async function RepairsPage() {
  const waNumber = await getWhatsAppNumber();

  return (
    <div className="min-h-screen marketplace-shell text-slate-900">
      <PublicHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-slate-200 bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="section-eyebrow mb-2 text-emerald-300">Repair services</p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              Professional Computer Repair Support
            </h1>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Request professional diagnosis and repair support from the nearest WAPTEK service branch. We handle laptops, desktops, and accessories.
            </p>
            {waNumber ? (
              <div className="mt-6">
                <WhatsAppLink
                  number={waNumber}
                  message={repairInquiryMessage()}
                  label="Ask About Repair on WhatsApp"
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* Services */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="section-eyebrow mb-1">What we fix</p>
          <h2 className="mb-6 text-2xl font-black text-slate-950">Common Repair Services</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repairServices.map((service) => (
              <div key={service.title} className="wcs-card rounded-2xl p-5">
                <span className="mb-3 block text-3xl" aria-hidden="true">{service.icon}</span>
                <p className="font-black text-slate-950">{service.title}</p>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{service.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="section-eyebrow mb-1">Simple process</p>
            <h2 className="mb-6 text-2xl font-black text-slate-950">How Repair Requests Work</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {repairSteps.map((item) => (
                <div key={item.step} className="wcs-card rounded-2xl p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-sm font-black text-emerald-800">
                    {item.step}
                  </div>
                  <p className="font-black text-slate-950">{item.title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Request form */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <DesignSurface className="p-6">
              <p className="section-eyebrow mb-1">Submit a request</p>
              <h2 className="text-2xl font-black text-slate-950">Repair Request Form</h2>
              <p className="mt-2 text-sm text-slate-600">
                Fill in your details and describe the fault. A technician will follow up from your chosen branch.
              </p>
              <RepairRequestForm />
            </DesignSurface>

            <aside className="h-fit space-y-4">
              {waNumber ? (
                <div className="rounded-2xl border border-[#25D366]/30 bg-[#25D366]/5 p-5">
                  <p className="font-black text-slate-950">Prefer to chat first?</p>
                  <p className="mt-1 text-sm text-slate-600">Describe your device issue directly on WhatsApp.</p>
                  <div className="mt-4">
                    <WhatsAppLink
                      number={waNumber}
                      message={repairInquiryMessage()}
                      label="Chat About Repair"
                      className="w-full justify-center"
                    />
                  </div>
                </div>
              ) : null}

              <DesignSurface className="p-5">
                <p className="font-black text-slate-950">Branch locations</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  {[
                    ["Yola Main Branch", "Adamawa — Jimeta commercial area"],
                    ["Damaturu Service Hub", "Yobe — Central business district"],
                    ["Maiduguri Sales Office", "Borno — Post Office area"],
                  ].map(([name, address]) => (
                    <div key={name} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-bold text-slate-800">{name}</p>
                      <p className="text-xs text-slate-500">{address}</p>
                    </div>
                  ))}
                </div>
              </DesignSurface>
            </aside>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
