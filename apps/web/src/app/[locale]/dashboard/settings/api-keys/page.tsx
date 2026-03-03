import { getTranslation } from "@workspace/i18n/server";
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

export default async function ApiKeysPage() {
  const { t } = await getTranslation({ ns: ["common", "dashboard"] });

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icons.Webhook />
        </EmptyMedia>
        <EmptyTitle>{t("apiKeys")}</EmptyTitle>
        <EmptyDescription>{t("settings.apiKeys.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <TurboLink
          className={buttonVariants({ variant: "outline" })}
          href="https://x.com/turbostarter_"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("settings.apiKeys.cta.primary")}
        </TurboLink>
      </EmptyContent>
    </Empty>
  );
}
