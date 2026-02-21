"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Controller, FormProvider, useForm } from "react-hook-form";

import { useTranslation } from "@workspace/i18n";
import { createAssistantSchema } from "@workspace/openclaw";
import { Model, MODELS } from "@workspace/openclaw/ai";
import {
  COMMUNICATION_CHANNELS,
  CommunicatonChannel,
} from "@workspace/openclaw/communication";
import { cn } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";

import { TelegramConfiguration } from "./communication/telegram";

import type { CreateAssistantSchemaInput } from "@workspace/openclaw";
const ChannelIcon = {
  [CommunicatonChannel.TELEGRAM]: Icons.Telegram,
  [CommunicatonChannel.DISCORD]: Icons.Discord,
  [CommunicatonChannel.WHATSAPP]: Icons.Whatsapp,
} as const;

const ChannelConfiguration = {
  [CommunicatonChannel.TELEGRAM]: TelegramConfiguration,
  [CommunicatonChannel.DISCORD]: null,
  [CommunicatonChannel.WHATSAPP]: null,
} as const;

const ModelIcon = {
  [Model.CLAUDE_OPUS_4_6]: Icons.Claude,
  [Model.OPENAI_5_2]: Icons.OpenAI,
  [Model.GEMINI_3_0_FLASH]: Icons.Gemini,
} as const;

interface CreateAssistantFormProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit: (data: CreateAssistantSchemaInput) => void;
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

  return (
    <FormProvider {...form}>
      <form
        className={cn(
          "flex min-h-[200px] w-full min-w-[280px] flex-col gap-6 overflow-hidden rounded-2xl border p-4 sm:gap-8 sm:p-6 md:gap-10 md:p-8",
          className,
        )}
        onSubmit={form.handleSubmit(onSubmit)}
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
                  const Icon = ChannelIcon[channel.id];
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
