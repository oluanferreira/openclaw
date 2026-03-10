/* eslint-disable i18next/no-literal-string */
"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";

import { SocialProvider } from "@workspace/auth";
import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import { auth } from "~/modules/auth/lib/api";

const providers = [
  {
    id: SocialProvider.GOOGLE,
    label: "Continuar com Google",
    icon: Icons.Google,
  },
  {
    id: SocialProvider.GITHUB,
    label: "Continuar com GitHub",
    icon: Icons.Github,
  },
] as const;

export function UserLogin() {
  const signIn = useMutation(auth.mutations.signIn.social);
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Icons.Logo className="text-primary mb-2 h-10" />
          <CardTitle className="text-xl">Acessar meu ClaW</CardTitle>
          <p className="text-muted-foreground text-sm">
            Faça login para acessar seu dashboard e gerenciar sua instância.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {providers.map(({ id, label, icon: Icon }, index) => (
            <Button
              key={id}
              variant={index === 0 ? "foreground" : "outline"}
              className="h-auto w-full px-4 py-2.5 text-base"
              onClick={() =>
                signIn.mutate({
                  provider: id,
                  callbackURL: pathsConfig.dashboard.index,
                })
              }
              disabled={signIn.isPending && signIn.variables.provider === id}
            >
              {signIn.isPending && signIn.variables.provider === id ? (
                <Spinner className="size-5" />
              ) : (
                <Icon className="size-5" />
              )}
              <span>{label}</span>
            </Button>
          ))}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-muted-foreground text-center text-sm">
            {t("login.consentPrefix")}{" "}
            <Link
              href={pathsConfig.legal.terms}
              className="hover:text-foreground underline"
            >
              {t("legal.terms")}
            </Link>{" "}
            {t("login.consentAnd")}{" "}
            <Link
              href={pathsConfig.legal.privacy}
              className="hover:text-foreground underline"
            >
              {t("legal.privacy")}
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
