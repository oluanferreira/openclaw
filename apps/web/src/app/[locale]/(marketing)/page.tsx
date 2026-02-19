import { withI18n } from "@workspace/i18n/with-i18n";

import { UseCases } from "~/modules/marketing/home/use-cases";

const HomePage = () => {
  return (
    <>
      <UseCases />
    </>
  );
};

export default withI18n(HomePage);
