import { getTranslation } from "@workspace/i18n/server";

import { pathsConfig } from "~/config/paths";
import { TurboLink } from "~/modules/common/turbo-link";

export const Footer = async () => {
  const { t } = await getTranslation({ ns: "common" });

  return (
    <footer className="w-full border-t py-6">
      <div className="flex flex-col items-center justify-between gap-4 px-6 sm:container sm:flex-row">
        <p className="text-muted-foreground text-sm">
          {t("footer.copyright")}
        </p>
        <nav className="flex gap-4">
          <TurboLink
            href={pathsConfig.legal.terms}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {t("legal.terms")}
          </TurboLink>
          <TurboLink
            href={pathsConfig.legal.privacy}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            {t("legal.privacy")}
          </TurboLink>
        </nav>
      </div>
    </footer>
  );
};
