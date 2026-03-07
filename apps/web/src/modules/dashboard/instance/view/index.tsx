"use client";

import { useTranslation } from "@workspace/i18n";
import { COMMUNICATION_CHANNELS } from "@workspace/openclaw/config";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";

import {
  DashboardHeader,
  DashboardHeaderTitle,
  DashboardHeaderDescription,
} from "~/modules/common/layout/dashboard/header";
import { DeployInstance } from "~/modules/dashboard/instance/deploy";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";
import { CommunicationSettings } from "./communication-settings";
import { ModelSettings } from "./model-settings";

import { InstanceHeader } from "./header";
import { InstanceLogs } from "./logs";
import { InstancePairing } from "./pairing";
import { InstanceGettingStarted } from "./getting-started";

export const ViewInstance = () => {
  const { instance } = useInstance();
  const { t, i18n } = useTranslation(["common", "dashboard"]);

  if (!instance.data) {
    return (
      <>
        <DashboardHeader>
          <div>
            <DashboardHeaderTitle>
              {t("instance.deploy.title")}
            </DashboardHeaderTitle>
            <DashboardHeaderDescription>
              {t("instance.deploy.description")}
            </DashboardHeaderDescription>
          </div>
        </DashboardHeader>
        <DeployInstance />
      </>
    );
  }

  const communication = COMMUNICATION_CHANNELS.find(
    (ch) => ch.id === instance.data?.communicationChannel,
  );

  return (
    <>
      <InstanceHeader />
      <InstanceGettingStarted instanceUrl={instance.data.url} />
      <InstancePairing />
      <section className="flex w-full flex-col gap-4">
        <span className="text-muted-foreground ml-1 text-sm uppercase">
          {t("configuration")}
        </span>
        <div className="grid w-full grid-cols-1 gap-4 @xl/dashboard:grid-cols-3">
          {/* Model Card — Editable */}
          <Card>
            <CardHeader className="p-5 pb-0! @md/dashboard:p-6">
              <CardTitle className="text-muted-foreground text-sm font-normal @md/dashboard:text-base">
                {t("model")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-3 text-base font-medium @md/dashboard:p-6 @md/dashboard:pt-4 @md/dashboard:text-lg">
              <ModelSettings />
            </CardContent>
          </Card>

          {/* Communication Card — Editable */}
          <Card>
            <CardHeader className="p-5 pb-0! @md/dashboard:p-6">
              <CardTitle className="text-muted-foreground text-sm font-normal @md/dashboard:text-base">
                {t("communication")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-3 text-base font-medium @md/dashboard:p-6 @md/dashboard:pt-4 @md/dashboard:text-lg">
              <CommunicationSettings />
            </CardContent>
          </Card>

          {/* Created At Card */}
          <Card>
            <CardHeader className="p-5 pb-0! @md/dashboard:p-6">
              <CardTitle className="text-muted-foreground text-sm font-normal @md/dashboard:text-base">
                {t("createdAt")}
              </CardTitle>
            </CardHeader>
            <CardContent className="truncate p-5 pt-3 text-base font-medium @md/dashboard:p-6 @md/dashboard:pt-4 @md/dashboard:text-lg">
              {new Date(instance.data.createdAt).toLocaleString(i18n.language)}
            </CardContent>
          </Card>
        </div>
      </section>

      <InstanceLogs />
    </>
  );
};
