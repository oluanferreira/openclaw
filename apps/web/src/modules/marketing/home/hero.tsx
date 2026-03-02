"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui-web/avatar";
import { buttonVariants } from "@workspace/ui-web/button";
import { Card } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import { auth } from "~/modules/auth/lib/api";
import { SocialProviders } from "~/modules/auth/social-providers";
import { TurboLink } from "~/modules/common/turbo-link";
import {
  DeployInstanceForm,
  DeployInstanceFormNote,
  DeployInstanceFormFooter,
  DeployInstanceSubmitButton,
} from "~/modules/dashboard/instance/deploy/form";
import { Section } from "~/modules/marketing/layout/section";

import type { User } from "@workspace/auth";

interface HeroProps {
  user: User | null;
}

export const Hero = ({ user }: HeroProps) => {
  const { t } = useTranslation(["common", "marketing", "dashboard"]);
  const router = useRouter();

  const signOut = useMutation({
    ...auth.mutations.signOut,
    onSuccess: () => {
      router.replace(pathsConfig.index);
      router.refresh();
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

      <Card className="relative w-full max-w-3xl rounded-[24px] border p-2 shadow-xs">
        <DeployInstanceForm>
          <DeployInstanceFormFooter>
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
                      onClick={() => signOut.mutate()}
                      type="button"
                      className="text-muted-foreground hover:text-primary ml-1 flex shrink-0 cursor-pointer items-center gap-1.5 transition-colors"
                      title="Sign out"
                      disabled={signOut.isPending}
                    >
                      {signOut.isPending ? (
                        <Spinner className="size-3.5" />
                      ) : (
                        <Icons.LogOut className="size-3.5" />
                      )}
                    </button>
                  </div>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            )}

            {user ? (
              <div className="flex flex-col items-stretch gap-2 sm:flex-row">
                <DeployInstanceSubmitButton />
                <TurboLink
                  href={pathsConfig.dashboard.index}
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
            )}
            <DeployInstanceFormNote
              {...(!user ? { note: t("instance.deploy.note.signIn") } : {})}
            />
          </DeployInstanceFormFooter>
        </DeployInstanceForm>
      </Card>
    </Section>
  );
};
