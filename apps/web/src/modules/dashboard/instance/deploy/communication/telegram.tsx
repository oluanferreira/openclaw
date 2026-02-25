import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Trans, useTranslation } from "@workspace/i18n";
import {
  telegramSchema,
  CommunicatonChannel,
} from "@workspace/openclaw/config";
import { Button } from "@workspace/ui-web/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui-web/dialog";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";

import type { CommunicationChannelConfig } from "@workspace/openclaw/config";

interface TelegramConfigurationProps {
  children: React.ReactElement;
  defaultValues?: Extract<
    CommunicationChannelConfig,
    { channel: typeof CommunicatonChannel.TELEGRAM }
  >;
  onSubmit: (
    data: Extract<
      CommunicationChannelConfig,
      { channel: typeof CommunicatonChannel.TELEGRAM }
    >,
  ) => void;
}

export const TelegramConfiguration = ({
  children,
  defaultValues,
  onSubmit,
}: TelegramConfigurationProps) => {
  const { t } = useTranslation("dashboard");
  const [open, setOpen] = useState(false);

  const form = useForm({
    resolver: standardSchemaResolver(telegramSchema),
    defaultValues: {
      channel: CommunicatonChannel.TELEGRAM,
      token: "",
      ...defaultValues,
    },
  });

  const handleTelegramSubmit = form.handleSubmit((data) => {
    setOpen(false);
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children} />
      <DialogContent
        showCloseButton={false}
        className="flex flex-col p-0 sm:max-w-4xl sm:gap-6 md:flex-row"
      >
        <section className="flex min-w-0 flex-1 flex-col justify-start gap-5 p-4 sm:gap-8 sm:p-6 md:p-9">
          <header className="flex items-center gap-3">
            <Icons.Telegram className="size-6 shrink-0" />
            <DialogTitle className="text-lg font-medium">
              {t("instance.deploy.communication.telegram.title")}
            </DialogTitle>
          </header>
          <DialogDescription className="sr-only">
            {t("instance.deploy.communication.telegram.steps.title")}
          </DialogDescription>
          <div className="flex w-full flex-col gap-3">
            <span className="text-base font-medium">
              {t("instance.deploy.communication.telegram.steps.title")}
            </span>
            <ol className="text-muted-foreground marker:text-foreground/30 list-inside list-decimal space-y-3.5 text-sm leading-relaxed marker:font-medium">
              <li>
                <span className="ml-2 inline">
                  <Trans
                    i18nKey="instance.deploy.communication.telegram.steps.step.1"
                    t={t}
                    components={{
                      bot: (
                        <a
                          href="https://t.me/BotFather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground/90 underline transition-colors duration-300 hover:text-[#2BA7DE]"
                        />
                      ),
                    }}
                  />
                </span>
              </li>
              <li>
                <span className="ml-2 inline">
                  <Trans
                    i18nKey="instance.deploy.communication.telegram.steps.step.2"
                    t={t}
                    components={{
                      code: (
                        <code className="bg-muted text-foreground/90 rounded px-1.5 py-0.5 font-mono text-xs" />
                      ),
                    }}
                  />
                </span>
              </li>
              <li>
                <span className="ml-2 inline">
                  {t("instance.deploy.communication.telegram.steps.step.3")}
                </span>
              </li>
              <li>
                <span className="ml-2 inline leading-relaxed">
                  {t("instance.deploy.communication.telegram.steps.step.4")}
                </span>
              </li>
              <li>
                <span className="ml-2 inline">
                  {t("instance.deploy.communication.telegram.steps.step.5")}
                </span>
              </li>
            </ol>
          </div>
          <form
            onSubmit={(event) => {
              event.stopPropagation();
              void handleTelegramSubmit(event);
            }}
            className="flex flex-col gap-5 sm:gap-8"
          >
            <Controller
              control={form.control}
              name="token"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-muted-foreground"
                  >
                    {t(
                      "instance.deploy.communication.telegram.form.token.label",
                    )}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    autoFocus
                  />
                </Field>
              )}
            />
            <Button
              type="submit"
              variant="foreground"
              className="w-full"
              disabled={!form.formState.isValid}
            >
              {t("instance.deploy.communication.telegram.form.cta")}
              <Icons.Check className="size-4 shrink-0" />
            </Button>
          </form>
        </section>

        <aside className="flex min-h-[200px] w-full shrink-0 justify-center md:min-h-0 md:w-[350px]">
          <div className="relative h-full w-full">
            <video
              controls
              playsInline
              preload="auto"
              className="block h-full w-full object-cover"
              loop
              autoPlay
              src="https://myfiles.simpleclaw.com/demo.mp4"
            ></video>
          </div>
        </aside>
      </DialogContent>
    </Dialog>
  );
};
