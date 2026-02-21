"use client";

import { useFormContext } from "react-hook-form";

import { Trans, useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui-web/avatar";
import { Button, buttonVariants } from "@workspace/ui-web/button";
import { Card } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

import { pathsConfig } from "~/config/paths";
import { authClient } from "~/lib/auth/client";
import { SocialProviders } from "~/modules/auth/social-providers";
import { TurboLink } from "~/modules/common/turbo-link";
import { CreateAssistantForm } from "~/modules/dashboard/assistant/create/form";
import { Section } from "~/modules/marketing/layout/section";

import type { CreateAssistantSchemaInput } from "@workspace/openclaw/";

export const Hero = () => {
  const { t } = useTranslation(["marketing", "dashboard"]);
  const session = authClient.useSession();
  const user = session.data?.user;

  const onSubmit = (data: unknown) => {
    console.log(data);
  };

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

      <Card className="relative w-full max-w-3xl rounded-[24px] border p-2 shadow-xs">
        <CreateAssistantForm onSubmit={onSubmit}>
          <div className="flex w-full min-w-0 flex-col gap-3">
            {user && (
              <div className="mb-4 flex min-w-0 items-center gap-2">
                <Avatar className="size-9">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
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

            <CreateAssistantFormFooter />
          </div>
        </CreateAssistantForm>
      </Card>
    </Section>
  );
};

const CreateAssistantFormFooter = () => {
  const { t } = useTranslation(["common", "dashboard"]);

  const session = authClient.useSession();
  const form = useFormContext<CreateAssistantSchemaInput>();

  const renderActions = () =>
    session.data?.user ? (
      <div className="flex flex-col items-center items-stretch gap-2 sm:flex-row">
        <Button
          variant="foreground"
          size="lg"
          disabled={!form.formState.isValid}
          className="h-auto px-4 py-2.5 text-base sm:px-5"
          type="submit"
        >
          <Icons.Zap className="size-5 shrink-0 fill-current" />
          {t("user.assistant.create.cta")}
        </Button>
        <TurboLink
          href={pathsConfig.dashboard.user.index}
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-auto px-4 py-2.5 text-base sm:px-5",
          )}
        >
          <Icons.Home className="size-4.5 shrink-0" />
          {t("goToDashboard")}
        </TurboLink>
      </div>
    ) : (
      <SocialProviders className="flex-col items-stretch sm:flex-row" />
    );
  const renderNote = () =>
    !session.data?.user ? (
      t("user.assistant.create.note.signIn")
    ) : !form.formState.isValid ? (
      t("user.assistant.create.note.invalid")
    ) : (
      <Trans
        i18nKey="user.assistant.create.note.pricing"
        t={t}
        components={{ strong: <span className="text-foreground" /> }}
      />
    );

  return (
    <>
      {renderActions()}
      <span className="text-muted-foreground text-sm font-medium">
        {renderNote()}{" "}
        <span className="text-primary">
          {t("user.assistant.create.note.limited")}
        </span>
      </span>
    </>
  );
};
