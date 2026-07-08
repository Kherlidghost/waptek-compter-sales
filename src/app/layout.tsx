import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naija Computer Marketplace POC",
  description: "Local multi-vendor computer sales and repair marketplace POC.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
