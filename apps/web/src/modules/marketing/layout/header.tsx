import { getTranslation } from "@workspace/i18n/server";

import { pathsConfig } from "~/config/paths";
import { getSession } from "~/lib/auth/server";
import { I18nControls } from "~/modules/common/i18n/controls";
import { ThemeSwitcher } from "~/modules/common/theme";
import { TurboLink } from "~/modules/common/turbo-link";
import { Icons } from "@workspace/ui-web/icons";
import { HeaderAuth } from "~/modules/marketing/layout/header-auth";

export const Header = async () => {
  const { t } = await getTranslation({ ns: "common" });
  const { user } = await getSession();

  return (
    <header className="w-full py-3">
      <div className="flex items-center justify-between px-6 pr-4 sm:container">
        <TurboLink
          href={pathsConfig.index}
          className="flex shrink-0 items-center gap-3"
          aria-label={t("home")}
        >
          <Icons.Logo className="text-primary h-9 md:h-10" />
          <Icons.LogoText className="text-foreground h-4.5 md:h-5" />
        </TurboLink>

        <div className="flex items-center gap-2">
          <HeaderAuth user={user} accessLabel={t("accessMyClaw")} />
          <ThemeSwitcher iconClassName="size-5" />
          <I18nControls iconClassName="size-4.5" />
        </div>
      </div>
    </header>
  );
};
