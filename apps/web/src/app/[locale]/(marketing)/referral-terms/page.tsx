import { withI18n } from "@workspace/i18n/with-i18n";

import { getMetadata } from "~/lib/metadata";
import { ReferralTerms } from "~/modules/legal/referral-terms";

export const generateMetadata = getMetadata({
  title: "common:legal.referralTerms",
});

const ReferralTermsPage = () => {
  return <ReferralTerms />;
};

export default withI18n(ReferralTermsPage);
