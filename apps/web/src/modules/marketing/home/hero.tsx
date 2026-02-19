"use client";

import { SocialProvider } from "@workspace/auth";
import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent } from "@workspace/ui-web/card";

import { pathsConfig } from "~/config/paths";
import { authClient } from "~/lib/auth/client";
import { Section } from "~/modules/marketing/layout/section";

export const Hero = () => {
  const { t } = useTranslation("marketing");
  return (
    <Section id="hero">
      <div className="mt-4 flex flex-col items-center gap-6">
        <h1 className="text-center text-4xl font-semibold tracking-tighter text-balance sm:text-5xl md:text-6xl lg:text-[4rem]">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-center text-sm leading-relaxed text-pretty sm:text-base lg:text-lg">
          {t("hero.subtitle")}
        </p>
      </div>

      <Card className="flex min-h-120 w-full min-w-0 flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:w-[80%] md:gap-10 md:p-8">
        <CardContent>
          <Button
            variant="outline"
            onClick={() =>
              authClient.signIn.social({
                provider: SocialProvider.GITHUB,
                callbackURL: pathsConfig.dashboard.user.index,
              })
            }
          >
            {SocialProvider.GITHUB}
          </Button>
        </CardContent>
      </Card>
    </Section>
  );
};
