import { InfoPage } from "@/components/InfoPage";

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="About"
      intro="CompuMarket NG connects customers with verified computer vendors, accessories, and repair service support across Adamawa, Yobe, and Borno."
      sections={[
        {
          title: "Regional computer marketplace",
          body: "The platform is built for buyers who want a practical way to find laptops, desktops, accessories, and repair-related services from approved vendors in North-East Nigeria.",
        },
        {
          title: "Verified vendor model",
          body: "Vendors are expected to be reviewed before selling, helping customers shop from a more trusted network while giving computer businesses a cleaner channel to reach buyers.",
        },
        {
          title: "Receipt-confirmed payment workflow",
          body: "Customers pay to the company account, upload a receipt, and wait for cashier confirmation before an order moves forward for processing.",
        },
      ]}
      title="About CompuMarket NG"
    />
  );
}
