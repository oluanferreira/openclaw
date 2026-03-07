"use client";

import { useTranslation } from "@workspace/i18n";
import { Icons } from "@workspace/ui-web/icons";
import { Button } from "@workspace/ui-web/button";

import { SkillCard } from "../components/skill-card";
import { useSkills } from "../hooks/use-skills";

export function SkillsView() {
  const { t } = useTranslation("dashboard");
  const { skills, toggleSkill } = useSkills();

  const handleToggle = (skillName: string, enabled: boolean) => {
    toggleSkill.mutate({ skillName, enabled });
  };

  const handleSaveCredentials = (skillName: string, credentials: Record<string, string>) => {
    toggleSkill.mutate({ skillName, enabled: true, credentials });
  };

  if (skills.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
            <p className="mt-1 text-muted-foreground">{t("skills.description")}</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (skills.isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("skills.description")}</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("skills.description")}</p>
        </div>
        <a
          href="https://clawhub.ai/skills?nonSuspicious=true"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">
            <Icons.Globe className="size-4" />
            {t("skills.browseClawHub")}
          </Button>
        </a>
      </div>

      {categories && (
        <>
          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("skills.categories.auto")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("skills.categories.autoDescription")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.auto.map((skill) => (
                <SkillCard key={skill.name} skill={skill} onToggle={handleToggle} onSaveCredentials={handleSaveCredentials} isLoading={toggleSkill.isPending} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("skills.categories.config")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("skills.categories.configDescription")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.config.map((skill) => (
                <SkillCard key={skill.name} skill={skill} onToggle={handleToggle} onSaveCredentials={handleSaveCredentials} isLoading={toggleSkill.isPending} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("skills.categories.install")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("skills.categories.installDescription")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.install.map((skill) => (
                <SkillCard key={skill.name} skill={skill} onToggle={handleToggle} onSaveCredentials={handleSaveCredentials} isLoading={toggleSkill.isPending} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
