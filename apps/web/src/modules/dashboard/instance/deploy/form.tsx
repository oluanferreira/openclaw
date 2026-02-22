"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useMutation } from "@tanstack/react-query";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { toast } from "sonner";

import { Trans, useTranslation } from "@workspace/i18n";
import { deployInstanceSchema } from "@workspace/openclaw";
import { MODELS } from "@workspace/openclaw/ai";
import {
  COMMUNICATION_CHANNELS,
  CommunicatonChannel,
} from "@workspace/openclaw/communication";
import { cn } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { instance } from "~/modules/dashboard/instance/lib/api";

import { ModelIcon } from "../icons";
import { CommunicationChannelIcon } from "../icons";

import { TelegramConfiguration } from "./communication/telegram";

import type { DeployInstanceSchemaInput } from "@workspace/openclaw";

const ChannelConfiguration = {
  [CommunicatonChannel.TELEGRAM]: TelegramConfiguration,
  [CommunicatonChannel.DISCORD]: null,
  [CommunicatonChannel.WHATSAPP]: null,
} as const;

interface DeployInstanceFormProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit?: (data: DeployInstanceSchemaInput) => Promise<void> | void;
}

export const DeployInstanceForm = ({
  className,
  children,
  onSubmit,
  ...props
}: DeployInstanceFormProps) => {
  const { t } = useTranslation("dashboard");
  const form = useForm({
    resolver: standardSchemaResolver(deployInstanceSchema),
    defaultValues: {
      model: MODELS[0].id,
      communication: {},
    },
  });

  const deploy = useMutation(instance.mutations.deploy);

  const handleSubmit = async (data: DeployInstanceSchemaInput) => {
    try {
      await deploy.mutateAsync(data);
      await onSubmit?.(data);
      toast.success("Deployment started. This can take a few minutes.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start deployment.",
      );
    }
  };

  return (
    <FormProvider {...form}>
      <form
        className={cn(
          "flex min-h-[200px] w-full min-w-[280px] flex-col gap-6 overflow-hidden rounded-2xl border p-4 sm:gap-8 sm:p-6 md:gap-10 md:p-8",
          className,
        )}
        onSubmit={form.handleSubmit(handleSubmit)}
        {...props}
      >
        <Controller
          control={form.control}
          name="model"
          render={({ field }) => (
            <Field className="gap-3 sm:gap-4">
              <FieldLabel className="text-base text-balance sm:text-lg">
                {t("user.instance.deploy.model.label")}
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
                {t("user.instance.deploy.communication.label")}
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
        <Spinner />
      ) : (
        <Icons.Zap className="size-5 shrink-0 fill-current" />
      )}
      {t("user.instance.deploy.cta")}
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
      return t("user.instance.deploy.note.invalid");
    }

    return (
      <Trans
        i18nKey="user.instance.deploy.note.pricing"
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
      <span className="text-primary">
        {t("user.instance.deploy.note.limited")}
      </span>
    </span>
  );
};
