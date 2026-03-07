"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";
import { MODELS } from "@workspace/openclaw/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui-web/select";
import { Spinner } from "@workspace/ui-web/spinner";

import { useApiKeys } from "~/modules/dashboard/instance/hooks/use-api-keys";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";
import { ModelIcon } from "~/modules/dashboard/instance/icons";
import { instance as instanceApi } from "~/modules/dashboard/instance/lib/api";

const MODEL_TO_KEY = {
  "claude-opus-4-6": "anthropicApiKey",
  "gpt-5.2": "openaiApiKey",
  "gemini-3-flash-preview": "googleApiKey",
} as const;

export const ModelSettings = () => {
  const { t } = useTranslation("dashboard");
  const { instance } = useInstance();
  const { keys } = useApiKeys();
  const queryClient = useQueryClient();

  const updateModel = useMutation({
    ...instanceApi.mutations.updateModel,
    onMutate: () => {
      toast.loading(t("instance.settings.model.restarting"), { id: "model-update" });
    },
    onSuccess: async (data) => {
      toast.dismiss("model-update");
      await queryClient.invalidateQueries(instanceApi.queries.get);
      toast.success(t("instance.settings.model.success", { model: MODELS.find((m) => m.id === data.model)?.name ?? data.model }));
    },
    onError: (error) => {
      toast.dismiss("model-update");
      toast.error(error.message || t("instance.settings.model.error"));
    },
  });

  const currentModel = instance.data?.model;

  const handleModelChange = (value: string | null) => {
    if (!value || value === currentModel || updateModel.isPending) return;
    updateModel.mutate({ model: value });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        {(() => {
          const model = MODELS.find((m) => m.id === currentModel);
          if (!model) return null;
          const Icon = ModelIcon[model.id];
          return (
            <div className="inline-flex items-center gap-2">
              <Icon className="size-5" />
              <span className="font-medium">{model.name}</span>
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
            {MODELS.map((model) => {
              const keyField = MODEL_TO_KEY[model.id];
              const hasKey = !!keys.data?.[keyField];
              const Icon = ModelIcon[model.id];
              return (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  disabled={!hasKey}
                >
                  <Icon className="size-4" />
                  <span>{model.name}</span>
                  {!hasKey && (
                    <span className="text-muted-foreground text-xs ml-1">
                      ({t("instance.settings.model.noKey")})
                    </span>
                  )}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
