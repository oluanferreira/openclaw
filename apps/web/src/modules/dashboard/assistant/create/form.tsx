"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";

import { Trans, useTranslation } from "@workspace/i18n";
import { createAssistantSchema } from "@workspace/openclaw";
import { MODELS } from "@workspace/openclaw/ai";
import {
  COMMUNICATION_CHANNELS,
  CommunicatonChannel,
} from "@workspace/openclaw/communication";
import { cn } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";

import { ModelIcon } from "../icons";
import { CommunicationChannelIcon } from "../icons";

import { TelegramConfiguration } from "./communication/telegram";

import type { CreateAssistantSchemaInput } from "@workspace/openclaw";

const ChannelConfiguration = {
  [CommunicatonChannel.TELEGRAM]: TelegramConfiguration,
  [CommunicatonChannel.DISCORD]: null,
  [CommunicatonChannel.WHATSAPP]: null,
} as const;

interface CreateAssistantFormProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit?: (data: CreateAssistantSchemaInput) => void;
}

export const CreateAssistantForm = ({
  className,
  children,
  onSubmit,
  ...props
}: CreateAssistantFormProps) => {
  const { t } = useTranslation("dashboard");
  const form = useForm({
    resolver: standardSchemaResolver(createAssistantSchema),
    defaultValues: {
      model: MODELS[0].id,
      communication: {},
    },
  });

  const handleSubmit = (data: CreateAssistantSchemaInput) => {
    onSubmit?.(data);
    console.log(data);
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
                {t("user.assistant.create.model.label")}
              </FieldLabel>

              <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
                {MODELS.map((model) => {
                  const Icon = ModelIcon[model.id];
                  return (
                    <Button
                      key={model.id}
                      variant="outline"
                      size="lg"
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
                {t("user.assistant.create.communication.label")}
              </FieldLabel>

              <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
                {COMMUNICATION_CHANNELS.map((channel) => {
                  const Icon = CommunicationChannelIcon[channel.id];
                  const Configuration = ChannelConfiguration[channel.id];

                  const trigger = (
                    <Button
                      variant="outline"
                      size="lg"
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

export const CreateAssistantFormFooter = ({
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

export const CreateAssistantSubmitButton = ({
  className,
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { t } = useTranslation("dashboard");
  const form = useFormContext<CreateAssistantSchemaInput>();

  return (
    <Button
      variant="foreground"
      size="lg"
      className={cn("h-auto px-4 py-2.5 text-base sm:px-5", className)}
      type="submit"
      disabled={!form.formState.isValid}
      {...props}
    >
      <Icons.Zap className="size-5 shrink-0 fill-current" />
      {t("user.assistant.create.cta")}
    </Button>
  );
};

interface CreateAssistantFormNoteProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  note?: React.ReactNode;
}

export const CreateAssistantFormNote = ({
  note,
  className,
  ...props
}: CreateAssistantFormNoteProps) => {
  const { t } = useTranslation("dashboard");
  const form = useFormContext<CreateAssistantSchemaInput>();

  const renderNote = () => {
    if (note) {
      return note;
    }

    if (!form.formState.isValid) {
      return t("user.assistant.create.note.invalid");
    }

    return (
      <Trans
        i18nKey="user.assistant.create.note.pricing"
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
        {t("user.assistant.create.note.limited")}
      </span>
    </span>
  );
};
