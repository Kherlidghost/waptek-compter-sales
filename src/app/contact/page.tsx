import { InfoPage } from "@/components/InfoPage";

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Contact"
      intro="Reach CompuMarket NG for order support, payment confirmation questions, repair requests, and vendor onboarding."
      sections={[
        {
          title: "Customer support",
          body: "Email support@compumarket.ng or call +234 800 000 0001 for help with product orders, receipt uploads, and order tracking.",
        },
        {
          title: "WhatsApp support",
          body: "WhatsApp support is represented with the placeholder number +234 800 000 0000 while the live support line is being finalized.",
        },
        {
          title: "Supported locations",
          body: "CompuMarket NG currently focuses on Adamawa, Yobe, and Borno, with branch-supported operations for sales and repair service handling.",
        },
      ]}
      title="Contact CompuMarket NG"
    />
  );
}
