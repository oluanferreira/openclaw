import envConfig from "env.config";

import { Trans } from "@workspace/i18n";
import { getTranslation } from "@workspace/i18n/server";

import { appConfig } from "~/config/app";
import {
  Section,
  SectionBadge,
  SectionHeader,
  SectionTitle,
} from "~/modules/marketing/layout/section";

export const Comparison = async () => {
  const { t } = await getTranslation({ ns: ["common", "marketing"] });

  const traditionalSteps = [
    {
      label: t("comparison.traditional.steps.provisionCloudServer"),
      minutes: 20,
    },
    {
      label: t("comparison.traditional.steps.generateSshKeys"),
      minutes: 12,
    },
    {
      label: t("comparison.traditional.steps.establishServerConnection"),
      minutes: 8,
    },
    {
      label: t("comparison.traditional.steps.installNodeAndPackageManager"),
      minutes: 10,
    },
    {
      label: t("comparison.traditional.steps.installOpenClaw"),
      minutes: 12,
    },
    {
      label: t("comparison.traditional.steps.configureOpenClawEnvironment"),
      minutes: 15,
    },
    {
      label: t("comparison.traditional.steps.linkAiProvider"),
      minutes: 7,
    },
    {
      label: t("comparison.traditional.steps.integrateTelegram"),
      minutes: 6,
    },
  ];
  const totalMinutes = traditionalSteps.reduce(
    (sum, step) => sum + step.minutes,
    0,
  );

  return (
    <Section id="comparison">
      <SectionHeader>
        <SectionBadge>{t("comparison", { ns: "common" })}</SectionBadge>
        <SectionTitle>
          {t("comparison.title", {
            productName: envConfig.NEXT_PUBLIC_PRODUCT_NAME,
          })}
        </SectionTitle>
      </SectionHeader>

      <div className="mt-4 flex min-w-0 flex-col items-stretch sm:mt-7 md:flex-row md:gap-0">
        <div className="flex min-w-0 flex-1 flex-col gap-2 pb-6 md:pr-10 md:pb-0">
          <p className="text-muted-foreground mb-1 text-base font-medium italic sm:text-lg">
            {t("traditional", { ns: "common" })}
          </p>
          <ul className="flex flex-col gap-2 text-pretty sm:gap-3">
            {traditionalSteps.map((step, i) => (
              <li
                key={i}
                className="text-muted-foreground flex justify-between gap-2 text-sm sm:text-base"
              >
                <span className="min-w-0">{step.label}</span>
                <span className="shrink-0 tabular-nums">
                  {step.minutes} {t("minutesShort", { ns: "common" })}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between border-t-2 pt-3 text-base font-medium sm:text-lg">
            <span>{t("total", { ns: "common" })}</span>
            <span className="text-xl font-medium tabular-nums">
              {totalMinutes} {t("minutesShort", { ns: "common" })}
            </span>
          </p>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed font-medium text-pretty">
            <Trans
              i18nKey="comparison.traditional.note"
              t={t}
              components={{
                highlight: (
                  <span className="text-primary bg-primary/10 rounded px-1.5 py-0.5" />
                ),
              }}
            />
          </p>
        </div>
        <div
          className="bg-border h-[2px] w-full shrink-0 md:h-auto md:min-h-px md:w-[2px]"
          aria-hidden="true"
        ></div>
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 pt-6 md:pt-0 md:pl-10">
          <p className="text-muted-foreground text-base font-medium italic sm:text-lg">
            {appConfig.name}
          </p>
          <p className="text-2xl font-semibold tabular-nums sm:text-4xl">
            {t("comparison.product.timeUnderSeconds", { seconds: 30 })}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-base">
            {t("comparison.product.subtitle")}
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-base">
            {t("comparison.product.description")}
          </p>
        </div>
      </div>
    </Section>
  );
};
