import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppFloatingButtonGuard } from "@/components/WhatsAppFloatingButtonGuard";
import { resolveWhatsAppNumber } from "@/lib/whatsapp";
import { isSupabaseConfigured } from "@/lib/supabase-config";

export const metadata: Metadata = {
  title: "WAPTEK COMPUTER SERVICES",
  description: "Sales of Computers & Repairs.",
};

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const waNumber = await getWhatsAppNumber();

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        {children}
        {waNumber ? <WhatsAppFloatingButtonGuard number={waNumber} /> : null}
      </body>
    </html>
  );
}
