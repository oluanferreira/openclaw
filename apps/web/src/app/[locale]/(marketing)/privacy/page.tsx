import { withI18n } from "@workspace/i18n/with-i18n";

import { getMetadata } from "~/lib/metadata";
import { PrivacyPolicy } from "~/modules/legal/privacy-policy";

export const generateMetadata = getMetadata({
  title: "common:legal.privacy",
});

const PrivacyPage = () => {
  return <PrivacyPolicy />;
};

export default withI18n(PrivacyPage);
