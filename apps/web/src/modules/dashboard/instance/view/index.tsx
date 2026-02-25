"use client";

import { useTranslation } from "@workspace/i18n";
import { MODELS, COMMUNICATION_CHANNELS } from "@workspace/openclaw/config";
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
import {
  CommunicationChannelIcon,
  ModelIcon,
} from "~/modules/dashboard/instance/icons";

import { InstanceHeader } from "./header";
import { InstanceLogs } from "./logs";
import { InstancePairing } from "./pairing";

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

  const details = [
    {
      id: "model",
      label: t("model"),
      value: (() => {
        const model = MODELS.find((model) => model.id === instance.data?.model);
        if (!model) return null;
        const Icon = ModelIcon[model.id];
        return (
          <div className="inline-flex items-center gap-2 @md/dashboard:gap-3">
            <Icon className="size-5 @md/dashboard:size-6" />
            <span>{model.name}</span>
          </div>
        );
      })(),
    },
    {
      id: "communication",
      label: t("communication"),
      value: (() => {
        const communication = COMMUNICATION_CHANNELS.find(
          (channel) => channel.id === instance.data?.communicationChannel,
        );

        if (!communication) return null;

        const Icon = CommunicationChannelIcon[communication.id];
        return (
          <div className="inline-flex items-center gap-2 @md/dashboard:gap-3">
            <Icon className="size-5 @md/dashboard:size-6" />
            <span>{communication.name}</span>
          </div>
        );
      })(),
    },
    {
      id: "createdAt",
      label: t("createdAt"),
      value: new Date(instance.data.createdAt).toLocaleString(i18n.language),
    },
  ];

  return (
    <>
      <InstanceHeader />
      <InstancePairing />
      <section className="flex w-full flex-col gap-4">
        <span className="text-muted-foreground ml-1 text-sm uppercase">
          {t("configuration")}
        </span>
        <div className="grid w-full grid-cols-1 gap-4 @xl/dashboard:grid-cols-3">
          {details
            .filter(({ value }) => value !== null)
            .map((detail) => (
              <Card key={detail.id}>
                <CardHeader className="p-5 pb-0! @md/dashboard:p-6">
                  <CardTitle className="text-muted-foreground text-sm font-normal @md/dashboard:text-base">
                    {detail.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="truncate p-5 pt-3 text-base font-medium @md/dashboard:p-6 @md/dashboard:pt-4 @md/dashboard:text-lg">
                  {detail.value}
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <InstanceLogs />
    </>
  );
};
