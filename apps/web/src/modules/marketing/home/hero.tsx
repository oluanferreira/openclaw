"use client";

import { Controller, useForm } from "react-hook-form";

import { useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui-web/avatar";
import { Button } from "@workspace/ui-web/button";
import { Card } from "@workspace/ui-web/card";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";

import { authClient } from "~/lib/auth/client";
import { SocialProviders } from "~/modules/auth/social-providers";
import { Section } from "~/modules/marketing/layout/section";

const aiModels = [
  {
    id: "claude-4.5-sonnet",
    name: "Claude Opus 4.5",
    icon: Icons.Claude,
  },
  {
    id: "openai-gpt-4o",
    name: "GPT 5.2",
    icon: Icons.OpenAI,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 3.0 Flash",
    icon: Icons.Gemini,
  },
];

const chatApps = [
  {
    id: "telegram",
    name: "Telegram",
    icon: Icons.Telegram,
    available: true,
  },
  {
    id: "discord",
    name: "Discord",
    icon: Icons.Discord,
    available: false,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: Icons.Whatsapp,
    available: false,
  },
];

export const Hero = () => {
  const { t } = useTranslation(["marketing", "dashboard"]);
  const sesssion = authClient.useSession();
  const user = sesssion?.data?.user;

  const form = useForm({
    defaultValues: {
      ai: aiModels[0]?.id,
      chat: "",
    },
  });

  return (
    <Section id="hero">
      <div className="mt-4 flex flex-col items-center gap-6">
        <h1 className="text-center text-4xl font-semibold tracking-tighter text-balance sm:text-5xl md:text-6xl lg:text-[4rem]">
          {t("hero.title")}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-center text-sm leading-relaxed text-pretty sm:text-base lg:text-lg">
          {t("hero.subtitle")}
        </p>
      </div>

      <Card className="relative rounded-[24px] border p-2 shadow-xs">
        <div className="min-h-[200px] w-full min-w-[280px] overflow-hidden rounded-2xl border">
          <div className="flex w-full min-w-0 flex-col gap-6 p-4 sm:gap-8 sm:p-6 md:gap-10 md:p-8">
            <Controller
              control={form.control}
              name="ai"
              render={({ field }) => (
                <Field className="gap-3 sm:gap-4">
                  <FieldLabel className="text-base text-balance sm:text-lg">
                    {t("user.assistant.new.model.label")}
                  </FieldLabel>

                  <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
                    {aiModels.map((model) => (
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
                        <model.icon className="size-5 fill-current" />
                        <span>{model.name}</span>
                        {field.value === model.id && (
                          <Icons.Check
                            className="ml-auto size-5"
                            strokeWidth={1.5}
                          />
                        )}
                      </Button>
                    ))}
                  </div>
                </Field>
              )}
            />
            <Field className="gap-3 sm:gap-4">
              <FieldLabel className="text-base text-balance sm:text-lg">
                {t("user.assistant.new.chat.label")}
              </FieldLabel>

              <div className="flex flex-col flex-wrap gap-3 sm:flex-row sm:gap-4">
                {chatApps.map((app) => (
                  <Button
                    key={app.id}
                    variant="outline"
                    size="lg"
                    className="relative justify-start px-4 py-3"
                    disabled={!app.available}
                  >
                    <app.icon className="size-5" />
                    <span>{app.name}</span>
                  </Button>
                ))}
              </div>
            </Field>

            <div className="flex w-full min-w-0 flex-col gap-3">
              {user && (
                <div className="mb-4 flex min-w-0 items-center gap-2">
                  <Avatar className="size-9">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback>
                      <Icons.UserRound className="size-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-sm font-medium">
                        {user.name}
                      </span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-primary ml-1 flex shrink-0 cursor-pointer items-center gap-1.5 transition-colors"
                        title="Sign out"
                      >
                        <Icons.LogOut className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  </div>
                </div>
              )}
              <SocialProviders className="flex-col items-stretch sm:flex-row" />
              <span className="text-muted-foreground text-sm font-medium">
                {t("user.assistant.new.note.signIn")}{" "}
                <span className="text-primary">
                  {t("user.assistant.new.note.limited")}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
};
