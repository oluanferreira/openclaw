"use client";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

export function SkillsView() {
  const { t } = useTranslation("dashboard");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("skills.description")}</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-lg">
            <Icons.Zap className="text-primary size-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{t("skills.exploreTitle")}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {t("skills.exploreDescription")}
            </p>
          </div>
          <a
            href="https://clawhub.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="shrink-0 gap-1.5">
              <Icons.ExternalLink className="size-3.5" />
              {t("skills.exploreCta")}
            </Button>
          </a>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-semibold">
          {t("skills.tutorialTitle")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(
            [
              {
                title: t("skills.steps.1.title"),
                description: t("skills.steps.1.description"),
              },
              {
                title: t("skills.steps.2.title"),
                description: t("skills.steps.2.description"),
              },
              {
                title: t("skills.steps.3.title"),
                description: t("skills.steps.3.description"),
              },
            ] as const
          ).map((step, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="bg-primary/10 text-primary mb-3 flex size-8 items-center justify-center rounded-full text-sm font-bold">
                  {i + 1}
                </div>
                <h3 className="mb-1 font-medium">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
