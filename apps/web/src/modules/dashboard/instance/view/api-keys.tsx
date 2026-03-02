"use client";

import { useState } from "react";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Spinner } from "@workspace/ui-web/spinner";

import {
  DashboardHeader,
  DashboardHeaderTitle,
  DashboardHeaderDescription,
} from "~/modules/common/layout/dashboard/header";

import { useApiKeys } from "../hooks/use-api-keys";

const AI_KEYS = [
  {
    id: "anthropicApiKey" as const,
    provider: "Anthropic",
    link: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  {
    id: "openaiApiKey" as const,
    provider: "OpenAI",
    link: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
  },
  {
    id: "googleApiKey" as const,
    provider: "Google",
    link: "https://aistudio.google.com/app/apikey",
    placeholder: "AIza...",
  },
] as const;

export const ApiKeysView = () => {
  const { t } = useTranslation("dashboard");
  const { keys, updateKeys } = useApiKeys();

  const [form, setForm] = useState({
    openaiApiKey: "",
    anthropicApiKey: "",
    googleApiKey: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateKeys.mutate(form);
  };

  if (keys.isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Spinner className="size-8" />
      </div>
    );
  }

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>API Keys</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("instance.apiKeys.description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-xl flex-col gap-6"
      >
        {AI_KEYS.map((config) => (
          <Field key={config.id} className="gap-2">
            <div className="flex items-center justify-between gap-2">
              <FieldLabel className="text-base">
                {config.provider}
              </FieldLabel>
              <a
                href={config.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
              >
                {t("instance.apiKeys.getKey")}
                <Icons.ExternalLink className="size-3.5" />
              </a>
            </div>
            <Input
              type="password"
              placeholder={
                keys.data?.[config.id]
                  ? keys.data[config.id]
                  : config.placeholder
              }
              value={form[config.id]}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [config.id]: e.target.value }))
              }
            />
            {keys.data?.[config.id] && (
              <span className="text-muted-foreground text-xs">
                {t("instance.apiKeys.current")}: {keys.data[config.id]}
              </span>
            )}
          </Field>
        ))}

        <Button
          type="submit"
          variant="foreground"
          size="lg"
          className="w-fit"
          disabled={
            updateKeys.isPending ||
            (!form.openaiApiKey && !form.anthropicApiKey && !form.googleApiKey)
          }
        >
          {updateKeys.isPending ? (
            <Spinner className="size-5" />
          ) : (
            <Icons.Check className="size-5" />
          )}
          {t("instance.apiKeys.save")}
        </Button>
      </form>
    </>
  );
};
