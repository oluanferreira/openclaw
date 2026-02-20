"use client";

import { useTranslation } from "@workspace/i18n";
import { Card } from "@workspace/ui-web/card";

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

      <Card></Card>
    </Section>
  );
};
