import { InfoPage } from "@/components/InfoPage";

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Privacy"
      intro="CompuMarket NG collects only the information needed to manage accounts, orders, payment confirmation, repairs, and vendor operations."
      sections={[
        {
          title: "Information we use",
          body: "The platform may store names, email addresses, phone numbers, order details, repair request information, and uploaded payment receipts.",
        },
        {
          title: "How information supports service",
          body: "Customer and vendor information is used to process orders, confirm payments, support repair requests, manage dashboards, and maintain marketplace records.",
        },
        {
          title: "Account security",
          body: "Authentication is handled through Supabase Auth. Users should protect their password and sign out after using shared devices.",
        },
      ]}
      title="Privacy Policy"
    />
  );
}
