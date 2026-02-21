import { getTranslation } from "@workspace/i18n/server";
import { MODELS } from "@workspace/openclaw/ai";
import { COMMUNICATION_CHANNELS } from "@workspace/openclaw/communication";
import { AvatarFallback, AvatarImage, Avatar } from "@workspace/ui-web/avatar";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";

import {
  DashboardHeader,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import {
  CommunicationChannelIcon,
  ModelIcon,
} from "~/modules/dashboard/assistant/icons";
import { DetailsList, DetailsListItem } from "~/modules/dashboard/details-list";

const assistant = {
  id: "1",
  name: "Assistant 1",
  url: "https://assistant-1.com",
  image: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Assistant-1",
  model: "claude-opus-4.6",
  parameters: "2GB RAM, 10GB SSD",
  communication: "telegram",
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default async function AssistantPage() {
  const { t, i18n } = await getTranslation({ ns: "common" });
  const details = [
    (() => {
      const model = MODELS.find((model) => model.id === assistant.model);
      if (!model) return null;
      const Icon = ModelIcon[model.id];
      return {
        id: "model",
        component: (
          <div className="flex flex-col items-start gap-3">
            <span className="text-sm font-medium">{t("model")}</span>
            <div className="inline-flex items-center gap-2">
              <Icon className="size-5" />
              <span>{model.name}</span>
            </div>
          </div>
        ),
      };
    })(),
    (() => {
      const communication = COMMUNICATION_CHANNELS.find(
        (channel) => channel.id === assistant.communication,
      );

      if (!communication) return null;

      const Icon = CommunicationChannelIcon[communication.id];
      return {
        id: "communication",
        component: (
          <div className="flex flex-col items-start gap-3">
            <span className="text-sm font-medium">{t("communication")}</span>
            <div className="inline-flex items-center gap-2">
              <Icon className="size-5" />
              <span>{communication.name}</span>
            </div>
          </div>
        ),
      };
    })(),
    {
      id: "url",
      component: (
        <div className="flex flex-col items-start gap-3">
          <span className="text-sm font-medium">{"URL"}</span>
          <a
            href="#"
            className="text-primary inline-flex items-center gap-2 underline underline-offset-3 hover:no-underline"
          >
            {assistant.url} <Icons.ExternalLink className="size-4" />
          </a>
        </div>
      ),
    },
    {
      id: "parameters",
      component: (
        <div className="flex flex-col items-start gap-3">
          <span className="text-sm font-medium">{t("parameters")}</span>
          <span>{assistant.parameters}</span>
        </div>
      ),
    },
    {
      id: "createdAt",
      component: (
        <div className="flex flex-col items-start gap-3">
          <span className="text-sm font-medium">{t("createdAt")}</span>
          <span>{assistant.createdAt.toLocaleString(i18n.language)}</span>
        </div>
      ),
    },
    {
      id: "updatedAt",
      component: (
        <div className="flex flex-col items-start gap-3">
          <span className="text-sm font-medium">{t("updatedAt")}</span>
          <span>{assistant.updatedAt.toLocaleString(i18n.language)}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <DashboardHeader>
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage
              //   src={assistant.image ?? undefined}
              //   alt={assistant.name ?? ""}
              src={assistant.image}
              alt={assistant.name}
            />
            <AvatarFallback>
              <Icons.UserRound className="w-7" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <DashboardHeaderTitle className="truncate">
                {assistant.name}
              </DashboardHeaderTitle>
              <Badge variant="success">{t("running")}</Badge>
            </div>

            <a
              href="#"
              className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-3 hover:no-underline"
            >
              {assistant.url} <Icons.ExternalLink className="size-3.5" />
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary">
            <Icons.Square />
            {t("stop")}
          </Button>
          <Button variant="outline">
            <Icons.RotateCcw />
            {t("restart")}
          </Button>
          <Button variant="destructive">
            <Icons.Trash />
            {t("delete")}
          </Button>
        </div>
      </DashboardHeader>

      <section className="@container/details w-full overflow-hidden">
        <DetailsList>
          {details.filter(Boolean).map((detail) => (
            <DetailsListItem key={detail.id}>
              {detail.component}
            </DetailsListItem>
          ))}
        </DetailsList>
      </section>

      <div className="mt-4 flex w-full flex-col gap-10">
        <section className="flex w-full flex-col gap-4">
          <header>
            <h3 className="text-xl font-semibold tracking-tight">
              {t("logs")}
            </h3>
          </header>
          <div className="bg-muted aspect-video w-full rounded-2xl"></div>
        </section>
      </div>
    </>
  );
}
