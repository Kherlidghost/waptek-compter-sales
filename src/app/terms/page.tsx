import { InfoPage } from "@/components/InfoPage";

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      intro="These terms explain the basic rules for using CompuMarket NG as a buyer, vendor, cashier, manager, or administrator."
      sections={[
        {
          title: "Marketplace use",
          body: "Users should provide accurate account, order, receipt, and repair request information. Vendors are responsible for keeping product details, prices, and stock information accurate.",
        },
        {
          title: "Orders and payments",
          body: "Orders are processed through manual bank transfer for now. A receipt upload is required, and payment status is only approved after cashier review.",
        },
        {
          title: "Vendor responsibility",
          body: "Approved vendors must list genuine computer products and accessories, respond to order updates, and cooperate with branch and admin review processes.",
        },
      ]}
      title="Terms & Conditions"
    />
  );
}
