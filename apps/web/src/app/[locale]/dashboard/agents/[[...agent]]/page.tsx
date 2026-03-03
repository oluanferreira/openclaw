import { getTranslation } from "@workspace/i18n/server";
import { Avatar, AvatarImage } from "@workspace/ui-web/avatar";
import { buttonVariants } from "@workspace/ui-web/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui-web/empty";
import { Icons } from "@workspace/ui-web/icons";

import { TurboLink } from "~/modules/common/turbo-link";

export default async function AgentsPage({
  params,
}: {
  params: Promise<{ agent?: string }>;
}) {
  const { agent } = await params;
  const { t } = await getTranslation({ ns: ["common", "dashboard"] });

  return (
    <Empty>
      <EmptyHeader>
        {agent ? (
          <Avatar size="lg" className="mb-2">
            <AvatarImage
              src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${decodeURIComponent(agent)}`}
              alt={agent}
              width={24}
              height={24}
            />
          </Avatar>
        ) : (
          <EmptyMedia variant="icon">
            <Icons.Bot />
          </EmptyMedia>
        )}
        <EmptyTitle>
          {agent ? decodeURIComponent(agent) : t("common:agents")}
        </EmptyTitle>
        <EmptyDescription>{t("agents.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <TurboLink
          className={buttonVariants()}
          href="https://docs.openclaw.ai/concepts/multi-agent"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("agents.cta.primary")}
        </TurboLink>
        <TurboLink
          className={buttonVariants({ variant: "outline" })}
          href="https://www.turbostarter.dev/ai"
          target="_blank"
        >
          {t("agents.cta.secondary")}
        </TurboLink>
      </EmptyContent>
    </Empty>
  );
}
