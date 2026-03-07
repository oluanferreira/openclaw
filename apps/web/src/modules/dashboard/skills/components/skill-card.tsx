"use client";

import { useState } from "react";

import { useTranslation } from "@workspace/i18n";
import { useQueryClient } from "@tanstack/react-query";

import type { SkillData } from "../lib/api";
import { skills as skillsApi } from "../lib/api";
import { GogSetupDialog } from "./gog-setup-dialog";

interface SkillCardProps {
  skill: SkillData;
  onToggle: (skillName: string, enabled: boolean) => void;
  onSaveCredentials: (
    skillName: string,
    credentials: Record<string, string>,
  ) => void;
  isLoading: boolean;
}

export function SkillCard({
  skill,
  onToggle,
  onSaveCredentials,
  isLoading,
}: SkillCardProps) {
  const { t } = useTranslation("dashboard");
  const queryClient = useQueryClient();
  const [credentialValues, setCredentialValues] = useState<
    Record<string, string>
  >({});
  const [showCredentials, setShowCredentials] = useState(false);
  const [showGogSetup, setShowGogSetup] = useState(false);

  const statusBadge = () => {
    if (skill.lastError) {
      return (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {t("skills.status.error")}
        </span>
      );
    }
    if (skill.enabled && skill.configured) {
      return (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {t("skills.status.active")}
        </span>
      );
    }
    if (skill.enabled && !skill.configured) {
      return (
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          {t("skills.status.pending")}
        </span>
      );
    }
    return (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        {t("skills.status.disabled")}
      </span>
    );
  };

  const handleCredentialsSave = () => {
    onSaveCredentials(skill.name, credentialValues);
    setShowCredentials(false);
    setCredentialValues({});
  };

  const handleGogComplete = () => {
    void queryClient.invalidateQueries(skillsApi.queries.list);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{skill.displayName}</h3>
            {statusBadge()}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {skill.description}
          </p>
          {skill.lastError && (
            <p className="mt-1 text-xs text-red-500">{skill.lastError}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {skill.name === "gog" && skill.credentialUrl && (
            <a
              href={skill.credentialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {t("skills.getCredential")}
              <svg className="size-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 3C3.22386 3 3 3.22386 3 3.5C3 3.77614 3.22386 4 3.5 4V3ZM8.5 3.5H9C9 3.22386 8.77614 3 8.5 3V3.5ZM8 8.5C8 8.77614 8.22386 9 8.5 9C8.77614 9 9 8.77614 9 8.5H8ZM2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L2.64645 8.64645ZM3.5 4H8.5V3H3.5V4ZM8 3.5V8.5H9V3.5H8ZM8.85355 3.14645L2.64645 9.35355L3.35355 8.64645L9.56066 2.43934L8.85355 3.14645Z" fill="currentColor"/>
              </svg>
            </a>
          )}
          {skill.name === "gog" && !skill.configured && (
            <button
              type="button"
              onClick={() => setShowGogSetup(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              {t("skills.gog.configure")}
            </button>
          )}
          {skill.requiresCredentials &&
            skill.category !== "auto" &&
            skill.name !== "gog" && (
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
              >
                {t("skills.configure")}
              </button>
            )}
          {skill.category !== "auto" && skill.name !== "gog" && (
            <button
              type="button"
              onClick={() => onToggle(skill.name, !skill.enabled)}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                skill.enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
              } ${isLoading ? "opacity-50" : ""}`}
            >
              <span
                className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
                  skill.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          )}
        </div>
      </div>
      {showCredentials && skill.credentialFields && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          {skill.credentialFields.map((field) => (
            <div key={field}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-muted-foreground">
                  {field}
                </label>
                {skill.credentialUrl && (
                  <a
                    href={skill.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {t("skills.getCredential")}
                    <svg className="size-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.5 3C3.22386 3 3 3.22386 3 3.5C3 3.77614 3.22386 4 3.5 4V3ZM8.5 3.5H9C9 3.22386 8.77614 3 8.5 3V3.5ZM8 8.5C8 8.77614 8.22386 9 8.5 9C8.77614 9 9 8.77614 9 8.5H8ZM2.64645 8.64645C2.45118 8.84171 2.45118 9.15829 2.64645 9.35355C2.84171 9.54882 3.15829 9.54882 3.35355 9.35355L2.64645 8.64645ZM3.5 4H8.5V3H3.5V4ZM8 3.5V8.5H9V3.5H8ZM8.85355 3.14645L2.64645 9.35355L3.35355 8.64645L9.56066 2.43934L8.85355 3.14645Z" fill="currentColor"/>
                    </svg>
                  </a>
                )}
              </div>
              <input
                type="password"
                value={credentialValues[field] ?? ""}
                onChange={(e) =>
                  setCredentialValues((prev) => ({
                    ...prev,
                    [field]: e.target.value,
                  }))
                }
                placeholder={`Enter ${field}`}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleCredentialsSave}
            disabled={
              isLoading ||
              !skill.credentialFields.every((f) => credentialValues[f])
            }
            className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {t("skills.saveCredentials")}
          </button>
        </div>
      )}
      {skill.name === "gog" && (
        <GogSetupDialog
          isOpen={showGogSetup}
          onClose={() => setShowGogSetup(false)}
          onComplete={handleGogComplete}
        />
      )}
    </div>
  );
}
