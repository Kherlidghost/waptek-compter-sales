import type { Metadata, Viewport } from "next";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WhatsAppFloatingButtonGuard } from "@/components/WhatsAppFloatingButtonGuard";
import { resolveWhatsAppNumber } from "@/lib/whatsapp";
import { isSupabaseConfigured } from "@/lib/supabase-config";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WAPTEK COMPUTER SERVICES",
  description:
    "Premium computers, accessories, and expert repairs from verified vendors across North-Eastern Nigeria.",
};

export const viewport: Viewport = {
  themeColor: "#0e1511",
  colorScheme: "dark",
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
    <html
      lang="en"
      className={`h-full antialiased bg-background ${geist.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="flex min-h-full flex-col bg-background text-ink-800">
        {children}
        {waNumber ? <WhatsAppFloatingButtonGuard number={waNumber} /> : null}
      </body>
    </html>
  );
}
