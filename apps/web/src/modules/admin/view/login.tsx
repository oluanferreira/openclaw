"use client";

import { useMutation } from "@tanstack/react-query";

import { SocialProvider } from "@workspace/auth";
import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import { auth } from "~/modules/auth/lib/api";

export function AdminLogin() {
  const signIn = useMutation(auth.mutations.signIn.social);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Icons.ShieldUser className="text-primary mb-2 size-10" />
          <CardTitle className="text-xl">Admin Panel</CardTitle>
          <p className="text-muted-foreground text-sm">
            Faça login com sua conta Google autorizada para acessar o painel
            administrativo.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            variant="foreground"
            className="h-auto w-full px-4 py-2.5 text-base"
            onClick={() =>
              signIn.mutate({
                provider: SocialProvider.GOOGLE,
                callbackURL: pathsConfig.admin.index,
              })
            }
            disabled={signIn.isPending}
          >
            {signIn.isPending ? (
              <Spinner className="size-5" />
            ) : (
              <Icons.Google className="size-5" />
            )}
            <span>Continuar com Google</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
