"use client";

import { useTranslation } from "@workspace/i18n";
import { Icons } from "@workspace/ui-web/icons";

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
      <div>
        <h1 className="text-2xl font-bold">{t("skills.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("skills.description")}</p>
      </div>

      <a
        href="https://clawhub.ai"
        target="_blank"
        rel="noopener noreferrer"
        className="group block rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 transition-all hover:border-primary/40 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
              <Icons.Zap className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("skills.exploreTitle")}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("skills.exploreDescription")}
              </p>
            </div>
          </div>
          <Icons.ExternalLink className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
        </div>
      </a>

      {categories && (
        <>
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

          <section>
            <h2 className="mb-3 text-lg font-semibold">{t("skills.categories.auto")}</h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("skills.categories.autoDescription")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {categories.auto.map((skill) => (
                <SkillCard key={skill.name} skill={skill} onToggle={handleToggle} onSaveCredentials={handleSaveCredentials} isLoading={toggleSkill.isPending} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
