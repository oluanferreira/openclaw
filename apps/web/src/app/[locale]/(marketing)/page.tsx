import { withI18n } from "@workspace/i18n/with-i18n";

import { Banner } from "~/modules/marketing/home/banner";

const HomePage = () => {
  return (
    <>
      <Banner />
    </>
  );
};

export default withI18n(HomePage);
