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

export default async function AccountPage() {
  const { t } = await getTranslation({ ns: ["common", "dashboard"] });

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icons.UserRound />
        </EmptyMedia>
        <EmptyTitle>{t("account")}</EmptyTitle>
        <EmptyDescription>{t("settings.account.description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <TurboLink
          className={buttonVariants()}
          href="https://www.turbostarter.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("settings.account.cta.primary")}
        </TurboLink>
        <TurboLink
          className={buttonVariants({ variant: "outline" })}
          href="https://www.turbostarter.dev/docs/web"
          target="_blank"
        >
          {t("settings.account.cta.secondary")}
        </TurboLink>
      </EmptyContent>
    </Empty>
  );
}
