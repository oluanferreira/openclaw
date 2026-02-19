import { withI18n } from "@workspace/i18n/with-i18n";

import { Comparison } from "~/modules/marketing/home/comparison";
import { Hero } from "~/modules/marketing/home/hero";
import { UseCases } from "~/modules/marketing/home/use-cases";

const HomePage = () => {
  return (
    <>
      <Hero />
      <Comparison />
      <UseCases />
    </>
  );
};

export default withI18n(HomePage);
