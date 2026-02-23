import { withI18n } from "@workspace/i18n/with-i18n";

import { getSession } from "~/lib/auth/server";
import { getMetadata } from "~/lib/metadata";
import { Comparison } from "~/modules/marketing/home/comparison";
import { Hero } from "~/modules/marketing/home/hero";
import { UseCases } from "~/modules/marketing/home/use-cases";

export const generateMetadata = getMetadata({
  title: "common:product.title",
  description: "common:product.description",
});

const HomePage = async () => {
  const { user } = await getSession();

  return (
    <>
      <Hero user={user} />
      <Comparison />
      <UseCases />
    </>
  );
};

export default withI18n(HomePage);
