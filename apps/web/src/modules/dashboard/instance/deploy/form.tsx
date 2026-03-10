"use client";

import { useEffect, useRef } from "react";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { useSearchParams, useRouter } from "next/navigation";

import { Trans, useTranslation } from "@workspace/i18n";
import { getDisplayPrice } from "@workspace/shared/constants";
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

import { useQueryClient } from "@tanstack/react-query";

import { useBilling } from "~/modules/dashboard/billing/hooks/use-billing";
import { billingApi } from "~/modules/dashboard/billing/lib/api";
import { ApiError } from "@workspace/api/utils";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";
import { useModels } from "~/modules/dashboard/instance/hooks/use-models";

import { getModelIcon } from "../icons";
import { CommunicationChannelIcon } from "../icons";

import { TelegramConfiguration } from "./communication/telegram";

import type { DeployInstanceSchemaInput } from "@workspace/openclaw";

export const DEPLOY_DATA_KEY = "openclaw:pending-deploy";

const ChannelConfiguration = {
  [CommunicatonChannel.TELEGRAM]: TelegramConfiguration,
  [CommunicatonChannel.DISCORD]: null,
  [CommunicatonChannel.WHATSAPP]: null,
} as const;

const PROVIDER_KEY_CONFIG: Record<
  string,
  {
    field: "openaiApiKey" | "anthropicApiKey" | "googleApiKey";
    provider: string;
    link: string;
    placeholder: string;
  }
> = {
  openai: {
    field: "openaiApiKey",
    provider: "OpenAI",
    link: "https://platform.openai.com/api-keys",
    placeholder: "sk-proj-...",
  },
  anthropic: {
    field: "anthropicApiKey",
    provider: "Anthropic",
    link: "https://console.anthropic.com/settings/keys",
    placeholder: "sk-ant-...",
  },
  google: {
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
  const { t, i18n } = useTranslation("dashboard");
  const { data: dbModels } = useModels();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isCheckoutReturn = searchParams.get("checkout") === "success";
  const autoDeployAttempted = useRef(false);
  const pendingDeployData = useRef<DeployInstanceSchemaInput | null>(null);

  // Use DB models if available, fall back to static MODELS
  const models = (dbModels as any[])?.length ? (dbModels as any[]) : MODELS;

  // Read saved data from localStorage once on mount
  if (pendingDeployData.current === null && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(DEPLOY_DATA_KEY);
      if (raw) pendingDeployData.current = JSON.parse(raw) as DeployInstanceSchemaInput;
    } catch {
      // ignore
    }
  }

  const form = useForm<DeployInstanceSchemaInput>({
    resolver: standardSchemaResolver(deployInstanceSchema),
    defaultValues: pendingDeployData.current ?? {
      model: models[0]?.id ?? MODELS[0].id,
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
  const queryClient = useQueryClient();

  // Poll subscription status while waiting for Stripe webhook after checkout
  useEffect(() => {
    if (!isCheckoutReturn || !pendingDeployData.current || autoDeployAttempted.current) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: billingApi.queries.subscription.queryKey });
    }, 2000);

    return () => clearInterval(interval);
  }, [isCheckoutReturn, queryClient]);

  // Auto-deploy once subscription becomes active after checkout
  const subscriptionStatus = subscription.data?.status;
  useEffect(() => {
    if (
      !isCheckoutReturn ||
      !pendingDeployData.current ||
      autoDeployAttempted.current ||
      subscriptionStatus !== "active"
    )
      return;

    autoDeployAttempted.current = true;
    const data = pendingDeployData.current;
    localStorage.removeItem(DEPLOY_DATA_KEY);
    pendingDeployData.current = null;

    const url = new URL(window.location.href);
    url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.pathname);

    deploy.mutate({ ...data, locale: i18n.language });
  }, [isCheckoutReturn, subscriptionStatus, deploy]);

  return (
    <FormProvider {...form}>
      <form
        className={cn(
          "flex min-h-[200px] w-full min-w-[280px] flex-col gap-6 overflow-hidden rounded-2xl border p-4 sm:gap-8 sm:p-6 md:gap-10 md:p-8",
          className,
        )}
        onSubmit={form.handleSubmit(async (data) => {
          if (!subscription.data || subscription.data.status !== "active") {
            localStorage.setItem(DEPLOY_DATA_KEY, JSON.stringify({ ...data, locale: i18n.language }));
            checkout.mutate();
            return;
          }
          try {
            await deploy.mutateAsync({ ...data, locale: i18n.language });
          } catch (error) {
            // Edge case: subscription expired between frontend check and API call
            if (error instanceof ApiError && error.code === "billing:subscription.required") {
              localStorage.setItem(DEPLOY_DATA_KEY, JSON.stringify({ ...data, locale: i18n.language }));
              checkout.mutate();
            }
            // Other errors are already handled by deploy's onError toast
          }
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
                {models.map((model: any) => {
                  const Icon = getModelIcon(model.provider);
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
  const { data: dbModels } = useModels();

  const models = (dbModels as any[])?.length ? (dbModels as any[]) : MODELS;
  const modelEntry = models.find((m: any) => m.id === selectedModel);
  const config = modelEntry ? PROVIDER_KEY_CONFIG[modelEntry.provider] : undefined;
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
  const { t, i18n } = useTranslation("dashboard");
  const form = useFormContext<DeployInstanceSchemaInput>();
  const currency = i18n.language === "pt" ? "brl" : "usd";
  const displayPrice = getDisplayPrice(currency);

  return (
    <span
      className={cn("text-muted-foreground text-sm font-medium", className)}
      {...props}
    >
      {note && <>{note}{" "}</>}
      {!note && !form.formState.isValid && <>{t("instance.deploy.note.invalid")}{" "}</>}
      <Trans
        i18nKey="instance.deploy.note.pricing"
        t={t}
        values={{ price: displayPrice }}
        components={{ strong: <span className="text-foreground" /> }}
      />{" "}
      <span className="text-red-500">{t("instance.deploy.note.limited")}</span>
    </span>
  );
};
