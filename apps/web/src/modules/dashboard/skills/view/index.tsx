"use client";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

import { SkillCard } from "../components/skill-card";
import { useSkills } from "../hooks/use-skills";

export function SkillsView() {
  const { t } = useTranslation("dashboard");
  const { skills, toggleSkill } = useSkills();

  const handleToggle = (skillName: string, enabled: boolean) => {
    toggleSkill.mutate({ skillName, enabled });
  };

  const handleSaveCredentials = (
    skillName: string,
    credentials: Record<string, string>,
  ) => {
    toggleSkill.mutate({ skillName, enabled: true, credentials });
  };

  if (skills.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("skills.description")}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="border-primary size-6 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (skills.isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("skills.description")}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {t("skills.error")}
        </div>
      </div>
    );
  }

  const categories = skills.data?.categories;

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

      {categories && (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {t("skills.categories.auto")}
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("skills.categories.autoDescription")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.auto.map((skill) => (
                <SkillCard
                  key={skill.name}
                  skill={skill}
                  onToggle={handleToggle}
                  onSaveCredentials={handleSaveCredentials}
                  isLoading={toggleSkill.isPending}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {t("skills.categories.config")}
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("skills.categories.configDescription")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.config.map((skill) => (
                <SkillCard
                  key={skill.name}
                  skill={skill}
                  onToggle={handleToggle}
                  onSaveCredentials={handleSaveCredentials}
                  isLoading={toggleSkill.isPending}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              {t("skills.categories.install")}
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              {t("skills.categories.installDescription")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.install.map((skill) => (
                <SkillCard
                  key={skill.name}
                  skill={skill}
                  onToggle={handleToggle}
                  onSaveCredentials={handleSaveCredentials}
                  isLoading={toggleSkill.isPending}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
