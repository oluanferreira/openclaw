"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef } from "react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import { billing as billingApi } from "~/modules/billing/lib/api";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";

import { ModelIcon } from "../icons";
import { CommunicationChannelIcon } from "../icons";
import { TelegramConfiguration } from "./communication/telegram";

import type { DeployInstanceSchemaInput } from "@workspace/openclaw";

const useDeploymentOptionsStore = create(
  persist<{
    options: DeployInstanceSchemaInput;
    setOptions: (options: DeployInstanceSchemaInput) => void;
  }>(
    (set) => ({
      options: {
        model: MODELS[0].id,
        communication: {
          channel: CommunicatonChannel.TELEGRAM,
          token: "",
        },
      },
      setOptions: (options) => set({ options }),
    }),
    {
      name: "deployment-options",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

const ChannelConfiguration = {
  [CommunicatonChannel.TELEGRAM]: TelegramConfiguration,
  [CommunicatonChannel.DISCORD]: null,
  [CommunicatonChannel.WHATSAPP]: null,
} as const;

const AUTO_DEPLOY_PARAM = "autodeploy";

export const DeployInstanceForm = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) => {
  const { t } = useTranslation("dashboard");

  const { options, setOptions } = useDeploymentOptionsStore();
  const form = useForm({
    resolver: standardSchemaResolver(deployInstanceSchema),
    defaultValues: options,
  });

  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [shouldAutoDeploy, setShouldAutoDeploy] = useQueryState(
    AUTO_DEPLOY_PARAM,
    parseAsBoolean.withDefault(false),
  );
  const hasAutoSubmittedRef = useRef(false);
  const checkout = useMutation(billingApi.mutations.checkout);
  const { deploy } = useInstance();

  const { mutateAsync: checkoutAsync } = checkout;
  const { mutateAsync: deployAsync } = deploy;

  const handleDeploy = useCallback(
    async (data: DeployInstanceSchemaInput) => {
      const activeSubscriptions = await queryClient.fetchQuery(
        billingApi.queries.active,
      );

      if (!activeSubscriptions.length) {
        const currentPath = pathname || pathsConfig.dashboard.index;
        return checkoutAsync({
          successUrl: `${currentPath}?${AUTO_DEPLOY_PARAM}=true`,
          cancelUrl: currentPath,
        });
      }

      await deployAsync(data);
      form.reset(options);
    },
    [checkoutAsync, deployAsync, options, form, pathname, queryClient],
  );

  useEffect(() => {
    const callback = form.subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        setOptions(values);
      },
    });

    return () => callback();
  }, [form, setOptions]);

  useEffect(() => {
    if (!shouldAutoDeploy || hasAutoSubmittedRef.current) {
      return;
    }

    hasAutoSubmittedRef.current = true;
    void setShouldAutoDeploy(null, { history: "replace" });
    void form.handleSubmit(handleDeploy)();
  }, [form, handleDeploy, setShouldAutoDeploy, shouldAutoDeploy]);

  return (
    <FormProvider {...form}>
      <form
        className={cn(
          "flex min-h-[200px] w-full min-w-[280px] flex-col gap-6 overflow-hidden rounded-2xl border p-4 sm:gap-8 sm:p-6 md:gap-10 md:p-8",
          className,
        )}
        onSubmit={form.handleSubmit(handleDeploy)}
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
                          field.value.channel === channel.id &&
                          !!field.value.token,
                      })}
                      disabled={channel.disabled}
                      key={channel.id}
                    >
                      <Icon className="size-5" />
                      <span>{channel.name}</span>
                      {field.value.channel === channel.id &&
                        !!field.value.token && (
                          <Icons.Check
                            className="ml-auto size-5"
                            strokeWidth={1.5}
                          />
                        )}
                    </Button>
                  );

                  if (Configuration) {
                    return (
                      <Configuration control={form.control} key={channel.id}>
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

interface DeployInstanceFormNoteProps extends React.HTMLAttributes<HTMLSpanElement> {
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
