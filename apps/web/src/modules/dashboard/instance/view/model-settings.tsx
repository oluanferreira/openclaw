"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";
import { MODELS, PROVIDER_TO_KEY } from "@workspace/openclaw/config";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui-web/select";
import { Spinner } from "@workspace/ui-web/spinner";

import { useApiKeys } from "~/modules/dashboard/instance/hooks/use-api-keys";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";
import { getModelIcon } from "~/modules/dashboard/instance/icons";
import { instance as instanceApi } from "~/modules/dashboard/instance/lib/api";

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

const PROVIDER_ORDER = ["anthropic", "openai", "google"] as const;

export const ModelSettings = () => {
  const { t } = useTranslation("dashboard");
  const { instance } = useInstance();
  const { keys } = useApiKeys();
  const queryClient = useQueryClient();

  const updateModel = useMutation({
    ...instanceApi.mutations.updateModel,
    onMutate: () => {
      toast.loading(t("instance.settings.model.restarting"), {
        id: "model-update",
      });
    },
    onSuccess: async (data) => {
      toast.dismiss("model-update");
      await queryClient.invalidateQueries(instanceApi.queries.get);
      toast.success(
        t("instance.settings.model.success", {
          model: MODELS.find((m) => m.id === data.model)?.name ?? data.model,
        }),
      );
    },
    onError: (error) => {
      toast.dismiss("model-update");
      toast.error(error.message || t("instance.settings.model.error"));
    },
  });

  const currentModel = instance.data?.model;
  const currentModelInfo = MODELS.find((m) => m.id === currentModel);

  const handleModelChange = (value: string | null) => {
    if (!value || value === currentModel || updateModel.isPending) return;
    updateModel.mutate({ model: value });
  };

  // Group models by provider
  const grouped = PROVIDER_ORDER.map((provider) => ({
    provider,
    label: PROVIDER_LABELS[provider] ?? provider,
    models: MODELS.filter((m) => m.provider === provider),
    hasKey: !!keys.data?.[PROVIDER_TO_KEY[provider] as keyof typeof keys.data],
  }));

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        {(() => {
          if (!currentModelInfo) {
            // Model not in our list (user set manually via config)
            return (
              <div className="inline-flex items-center gap-2">
                <span className="font-medium">{currentModel}</span>
              </div>
            );
          }
          const Icon = getModelIcon(currentModelInfo.provider);
          return (
            <div className="inline-flex items-center gap-2">
              <Icon className="size-5" />
              <span className="font-medium">{currentModelInfo.name}</span>
            </div>
          );
        })()}
      </div>
      <div className="flex items-center gap-2">
        {updateModel.isPending && <Spinner className="size-4" />}
        <Select
          value={currentModel}
          onValueChange={handleModelChange}
          disabled={updateModel.isPending}
        >
          <SelectTrigger size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {grouped.map((group, i) => {
              const Icon = getModelIcon(group.provider);
              return (
                <SelectGroup key={group.provider}>
                  {i > 0 && <SelectSeparator />}
                  <SelectLabel>
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="size-3.5" />
                      {group.label}
                    </span>
                  </SelectLabel>
                  {group.models.map((model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      disabled={!group.hasKey}
                    >
                      <span>{model.name}</span>
                      {!group.hasKey && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({t("instance.settings.model.noKey")})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectGroup>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
