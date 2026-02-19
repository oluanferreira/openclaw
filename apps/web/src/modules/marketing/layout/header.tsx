import { getTranslation } from "@workspace/i18n/server";
import { buttonVariants } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";

import { pathsConfig } from "~/config/paths";
import { I18nControls } from "~/modules/common/i18n/controls";
import { ThemeSwitcher } from "~/modules/common/theme";
import { TurboLink } from "~/modules/common/turbo-link";

export const Header = async () => {
  const { t } = await getTranslation({ ns: "common" });
  return (
    <header className="bg-background/80 sticky inset-0 top-(--banner-height,0px) z-40 w-full py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 pr-4 sm:container">
        <TurboLink
          href={pathsConfig.index}
          className="flex shrink-0 items-center gap-3"
          aria-label={t("home")}
        >
          <Icons.Logo className="text-primary h-9 md:h-10" />
          <Icons.LogoText className="text-foreground h-4.5 md:h-5" />
        </TurboLink>

        <div className="flex items-center justify-center">
          <I18nControls />
          <ThemeSwitcher />
          <TurboLink
            href="mailto:hello@turbostarter.dev"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <Icons.Mail className="size-5" />
            <span className="sr-only">{t("contactUs")}</span>
          </TurboLink>
        </div>
      </div>
    </header>
  );
};
