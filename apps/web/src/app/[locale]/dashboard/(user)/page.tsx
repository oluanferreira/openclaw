import { getTranslation } from "@workspace/i18n/server";

import { getMetadata } from "~/lib/metadata";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import { CreateAssistant } from "~/modules/dashboard/assistant/create";

export const generateMetadata = getMetadata({
  title: "createNewAssistant",
  description: "dashboard:user.home.description",
});

export default async function UserPage() {
  const { t } = await getTranslation({ ns: "dashboard" });
  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>
            {t("user.assistant.create.title")}
          </DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("user.assistant.create.description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <CreateAssistant />
    </>
  );
}
