import { InfoPage } from "@/components/InfoPage";

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Policy"
      intro="This return policy outlines how CompuMarket NG expects return and issue handling to work for computer products, accessories, and repair-related orders."
      sections={[
        {
          title: "Product condition checks",
          body: "Customers should inspect delivered or collected items promptly and report issues with the order number, product details, and supporting evidence.",
        },
        {
          title: "Vendor and branch review",
          body: "Return requests may be reviewed by the vendor, branch team, manager, or admin depending on product condition, warranty terms, and order status.",
        },
        {
          title: "Repair service issues",
          body: "Repair service concerns should be submitted with device details and the original repair request information so the branch team can review the case properly.",
        },
      ]}
      title="Return Policy"
    />
  );
}
