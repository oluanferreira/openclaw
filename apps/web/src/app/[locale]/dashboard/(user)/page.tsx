import { getTranslation } from "@workspace/i18n/server";

import { getMetadata } from "~/lib/metadata";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import { DeployInstance } from "~/modules/dashboard/instance/deploy";

export const generateMetadata = getMetadata({
  title: "dashboard:user.home.title",
  description: "dashboard:user.home.description",
});

export default async function UserPage() {
  const { t } = await getTranslation({ ns: "dashboard" });
  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>
            {t("user.instance.deploy.title")}
          </DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("user.instance.deploy.description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <DeployInstance />
    </>
  );
}
