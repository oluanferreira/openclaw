import { getMetadata } from "~/lib/metadata";
import { SubscriptionOverview } from "~/modules/billing/view";

export const generateMetadata = getMetadata({
  title: "billing:title",
  description: "billing:description",
});

export default function BillingPage() {
  return <SubscriptionOverview />;
}
