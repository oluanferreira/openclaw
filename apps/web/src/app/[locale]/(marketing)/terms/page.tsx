import { withI18n } from "@workspace/i18n/with-i18n";

import { getMetadata } from "~/lib/metadata";
import { TermsOfService } from "~/modules/legal/terms-of-service";

export const generateMetadata = getMetadata({
  title: "common:legal.terms",
});

const TermsPage = () => {
  return <TermsOfService />;
};

export default withI18n(TermsPage);
