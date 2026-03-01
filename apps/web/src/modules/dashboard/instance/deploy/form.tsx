"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";

import { Trans, useTranslation } from "@workspace/i18n";
import { deployInstanceSchema } from "@workspace/openclaw";
import {
  MODELS,
  COMMUNICATION_CHANNELS,
  CommunicatonChannel,
} from "@workspace/openclaw/config";
import { cn } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Spinner } from "@workspace/ui-web/spinner";

import { useBilling } from "~/modules/dashboard/billing/hooks/use-billing";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";

import { ModelIcon } from "../icons";
import { CommunicationChannelIcon } from "../icons";

import { TelegramConfiguration } from "./communication/telegram";

import type { DeployInstanceSchemaInput } from "@workspace/openclaw";

const ChannelConfiguration = {
  [CommunicatonChannel.TELEGRAM]: TelegramConfiguration,
  [CommunicatonChannel.DISCORD]: null,
  [CommunicatonChannel.WHATSAPP]: null,
} as const;

const AI_KEY_CONFIG: Record<
  string,
  {
    field: "openaiApiKey" | "anthropicApiKey" | "googleApiKey";
    provider: string;
    link: string;
    placeholder: string;
  }
> = {
  "gpt-5.2": {
    field: "openaiApiKey",
    provider: "OpenAI",
    link: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
  },
  "claude-opus-4-6": {
    field: "anthropicApiKey",
    provider: "Anthropic",
    link: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  "gemini-3-0-flash": {
    field: "googleApiKey",
    provider: "Google",
    link: "https://aistudio.google.com/app/apikey",
    placeholder: "AIza...",
  },
};

export const DeployInstanceForm = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) => {
  const { t } = useTranslation("dashboard");
  const form = useForm({
    resolver: standardSchemaResolver(deployInstanceSchema),
    defaultValues: {
      model: MODELS[0].id,
      communication: {},
      aiKeys: {
        openaiApiKey: "",
        anthropicApiKey: "",
        googleApiKey: "",
      },
    },
  });

  const { deploy } = useInstance();
  const { subscription, checkout } = useBilling();

  return (
    <FormProvider {...form}>
      <form
        className={cn(
          "flex min-h-[200px] w-full min-w-[280px] flex-col gap-6 overflow-hidden rounded-2xl border p-4 sm:gap-8 sm:p-6 md:gap-10 md:p-8",
          className,
        )}
        onSubmit={form.handleSubmit((data) => {
          if (!subscription.data || subscription.data.status !== "active") {
            checkout.mutate();
            return;
          }
          return deploy.mutateAsync(data);
        })}
        {...props}
      >
        <Controller
          control={form.control}
          name="model"
          render={({ field }) => (
            <Field className="gap-3 sm:gap-4">
              <FieldLabel className="text-base text-balance sm:text-lg">
                {t("instance.deploy.model.label")}
              </FieldLabel>

              <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
                {MODELS.map((model) => {
                  const Icon = ModelIcon[model.id];
                  return (
                    <Button
                      key={model.id}
                      variant="outline"
                      size="lg"
                      type="button"
                      className={cn("justify-start px-4 py-3", {
                        "border-primary dark:border-primary shadow-primary":
                          field.value === model.id,
                      })}
                      onClick={() => field.onChange(model.id)}
                    >
                      <Icon className="size-5 fill-current" />
                      <span>{model.name}</span>
                      {field.value === model.id && (
                        <Icons.Check
                          className="ml-auto size-5"
                          strokeWidth={1.5}
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
            </Field>
          )}
        />

        <AiKeyField />

        <Controller
          control={form.control}
          name="communication"
          render={({ field }) => (
            <Field className="gap-3 sm:gap-4">
              <FieldLabel className="text-base text-balance sm:text-lg">
                {t("instance.deploy.communication.label")}
              </FieldLabel>

              <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
                {COMMUNICATION_CHANNELS.map((channel) => {
                  const Icon = CommunicationChannelIcon[channel.id];
                  const Configuration = ChannelConfiguration[channel.id];

                  const trigger = (
                    <Button
                      variant="outline"
                      size="lg"
                      type="button"
                      className={cn("relative justify-start px-4 py-3", {
                        "border-primary dark:border-primary shadow-primary":
                          field.value.channel === channel.id,
                      })}
                      disabled={channel.disabled}
                      key={channel.id}
                    >
                      <Icon className="size-5" />
                      <span>{channel.name}</span>
                      {field.value.channel === channel.id && (
                        <Icons.Check
                          className="ml-auto size-5"
                          strokeWidth={1.5}
                        />
                      )}
                    </Button>
                  );

                  if (Configuration) {
                    return (
                      <Configuration
                        defaultValues={field.value}
                        onSubmit={field.onChange}
                        key={channel.id}
                      >
                        {trigger}
                      </Configuration>
                    );
                  }

                  return trigger;
                })}
              </div>
            </Field>
          )}
        />

        {children}
      </form>
    </FormProvider>
  );
};

const AiKeyField = () => {
  const { t } = useTranslation("dashboard");
  const { control } = useFormContext<DeployInstanceSchemaInput>();
  const selectedModel = useWatch({ control, name: "model" });

  const config = AI_KEY_CONFIG[selectedModel];
  if (!config) return null;

  return (
    <Controller
      control={control}
      name={`aiKeys.${config.field}`}
      render={({ field, fieldState }) => (
        <Field className="gap-3 sm:gap-4" data-invalid={fieldState.invalid}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel className="text-base text-balance sm:text-lg">
              {t("instance.deploy.aiKey.label", { provider: config.provider })}
            </FieldLabel>
            <a
              href={config.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              {t("instance.deploy.aiKey.link")}
              <Icons.ExternalLink className="size-3.5" />
            </a>
          </div>
          <Input
            {...field}
            type="password"
            placeholder={config.placeholder}
            aria-invalid={fieldState.invalid}
          />
        </Field>
      )}
    />
  );
};

export const DeployInstanceFormFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("flex w-full min-w-0 flex-col gap-3", className)}
      {...props}
    />
  );
};

export const DeployInstanceSubmitButton = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { t } = useTranslation("dashboard");
  const form = useFormContext<DeployInstanceSchemaInput>();

  return (
    <Button
      variant="foreground"
      size="lg"
      className={cn("h-auto px-4 py-2.5 text-base sm:px-5", className)}
      type="submit"
      disabled={!form.formState.isValid || form.formState.isSubmitting}
      {...props}
    >
      {form.formState.isSubmitting ? (
        <Spinner className="size-5" />
      ) : (
        <Icons.Zap className="size-5 shrink-0 fill-current" />
      )}
      {t("instance.deploy.cta")}
    </Button>
  );
};

interface DeployInstanceFormNoteProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  note?: React.ReactNode;
}

export const DeployInstanceFormNote = ({
  note,
  className,
  ...props
}: DeployInstanceFormNoteProps) => {
  const { t } = useTranslation("dashboard");
  const form = useFormContext<DeployInstanceSchemaInput>();

  const renderNote = () => {
    if (note) {
      return note;
    }

    if (!form.formState.isValid) {
      return t("instance.deploy.note.invalid");
    }

    return (
      <Trans
        i18nKey="instance.deploy.note.pricing"
        t={t}
        components={{ strong: <span className="text-foreground" /> }}
      />
    );
  };

  return (
    <span
      className={cn("text-muted-foreground text-sm font-medium", className)}
      {...props}
    >
      {renderNote()}{" "}
      <span className="text-primary">{t("instance.deploy.note.limited")}</span>
    </span>
  );
};
