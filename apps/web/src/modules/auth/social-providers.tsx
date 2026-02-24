"use client";

import { useMutation } from "@tanstack/react-query";

import { SocialProvider } from "@workspace/auth";
import { Trans, useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import { auth } from "~/modules/auth/lib/api";

const ProviderIcons = {
  [SocialProvider.GOOGLE]: Icons.Google,
  [SocialProvider.GITHUB]: Icons.Github,
} as const;

interface SocialProvidersProps extends React.ComponentProps<"div"> {
  redirectTo?: string;
}

export const SocialProviders = ({
  redirectTo = pathsConfig.dashboard.index,
  className,
  ...props
}: SocialProvidersProps) => {
  const { t } = useTranslation("auth");
  const signIn = useMutation(auth.mutations.signIn.social);

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      {Object.values(SocialProvider).map((provider, index) => {
        const Icon = ProviderIcons[provider];
        return (
          <Button
            key={provider}
            variant={index === 0 ? "foreground" : "outline"}
            type="button"
            className="h-auto px-4 py-2.5 text-base sm:px-5"
            onClick={() => signIn.mutate({ provider, callbackURL: redirectTo })}
            disabled={
              signIn.isPending && signIn.variables.provider === provider
            }
          >
            {signIn.isPending && signIn.variables.provider === provider ? (
              <Spinner className="size-5" />
            ) : (
              <Icon className="size-5" />
            )}
            <span>
              <Trans
                i18nKey="login.social"
                t={t}
                values={{ provider }}
                components={{ capitalize: <span className="capitalize" /> }}
              />
            </span>
          </Button>
        );
      })}
    </div>
  );
};
