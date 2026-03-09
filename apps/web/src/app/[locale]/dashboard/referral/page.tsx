import { getMetadata } from "~/lib/metadata";
import { ReferralView } from "~/modules/dashboard/referral/view";

export const generateMetadata = getMetadata({
  title: "dashboard:referral.home.title",
  description: "dashboard:referral.home.description",
});

export default function ReferralPage() {
  return <ReferralView />;
}
