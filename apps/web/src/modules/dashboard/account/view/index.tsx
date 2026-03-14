"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { handle } from "@workspace/api/utils";
import { useTranslation } from "@workspace/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui-web/avatar";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui-web/dialog";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import { api } from "~/lib/api/client";
import { authClient } from "~/lib/auth/client";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardFooter,
  SettingsCardHeader,
  SettingsCardTitle,
} from "~/modules/common/layout/dashboard/settings-card";

import type { User } from "@workspace/auth";

interface AccountViewProps {
  user: User;
}

export const AccountView = ({ user }: AccountViewProps) => {
  const { t } = useTranslation(["common", "dashboard"]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const confirmWord = t("dashboard:account.dangerZone.confirmWord");
  const isConfirmed = confirmation.toUpperCase() === confirmWord.toUpperCase();

  const newsletter = useQuery({
    queryKey: ["user", "newsletter"],
    queryFn: () => handle(api.user.newsletter.$get)(),
  });

  const updateNewsletter = useMutation({
    mutationFn: (optIn: boolean) =>
      handle(api.user.newsletter.$put)({ json: { optIn } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user", "newsletter"] });
      toast.success(t("dashboard:account.newsletter.success"));
    },
  });

  const deleteAccount = useMutation({
    mutationFn: () => authClient.deleteUser(),
    onSuccess: () => {
      router.replace(pathsConfig.index);
      router.refresh();
    },
  });

  const providerName = (() => {
    const image = user.image ?? "";
    if (image.includes("google")) return "Google";
    if (image.includes("github")) return "GitHub";
    return null;
  })();

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>
            {t("dashboard:account.home.title")}
          </DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("dashboard:account.home.description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <div className="flex w-full flex-col gap-4">
        <SettingsCard>
          <SettingsCardHeader>
            <SettingsCardTitle>
              {t("dashboard:account.profile.title")}
            </SettingsCardTitle>
            <SettingsCardDescription>
              {t("dashboard:account.profile.description")}
            </SettingsCardDescription>
          </SettingsCardHeader>
          <SettingsCardContent>
            <div className="flex items-center gap-4 py-2">
              <Avatar className="size-16">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback>
                  <Icons.UserRound className="size-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-1">
                <p className="text-base font-medium">{user.name}</p>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                {providerName && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {providerName}
                  </Badge>
                )}
              </div>
            </div>
          </SettingsCardContent>
          <SettingsCardFooter>
            <p className="text-muted-foreground text-sm">
              {t("dashboard:account.profile.readOnly")}
            </p>
          </SettingsCardFooter>
        </SettingsCard>

        <SettingsCard>
          <SettingsCardHeader>
            <SettingsCardTitle>
              {t("dashboard:account.newsletter.title")}
            </SettingsCardTitle>
            <SettingsCardDescription>
              {t("dashboard:account.newsletter.description")}
            </SettingsCardDescription>
          </SettingsCardHeader>
          <SettingsCardFooter>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={newsletter.data?.optIn ?? false}
                onChange={(e) => updateNewsletter.mutate(e.target.checked)}
                disabled={newsletter.isLoading || updateNewsletter.isPending}
                className="border-border accent-primary size-4 rounded"
              />
              <span className="text-sm">{t("common:newsletter.optIn")}</span>
            </label>
          </SettingsCardFooter>
        </SettingsCard>

        <SettingsCard variant="destructive">
          <SettingsCardHeader>
            <SettingsCardTitle>
              {t("dashboard:account.dangerZone.title")}
            </SettingsCardTitle>
            <SettingsCardDescription>
              {t("dashboard:account.dangerZone.description")}
            </SettingsCardDescription>
          </SettingsCardHeader>
          <SettingsCardFooter>
            <p className="text-muted-foreground text-sm">
              {t("dashboard:account.dangerZone.warning")}
            </p>
            <Dialog
              open={open}
              onOpenChange={(value) => {
                setOpen(value);
                if (!value) setConfirmation("");
              }}
            >
              <DialogTrigger
                render={<Button variant="destructive" size="sm" />}
              >
                {t("dashboard:account.dangerZone.cta")}
              </DialogTrigger>
              <DialogContent showCloseButton={false}>
                <DialogHeader>
                  <DialogTitle>
                    {t("dashboard:account.dangerZone.dialog.title")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("dashboard:account.dangerZone.dialog.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="delete-confirm"
                    className="text-muted-foreground text-sm"
                  >
                    {t("dashboard:account.dangerZone.dialog.label")}{" "}
                    <strong className="text-foreground font-semibold">
                      {confirmWord}
                    </strong>
                  </label>
                  <Input
                    id="delete-confirm"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    placeholder={confirmWord}
                    autoComplete="off"
                  />
                </div>
                <DialogFooter showCloseButton>
                  <Button
                    variant="destructive"
                    disabled={!isConfirmed || deleteAccount.isPending}
                    onClick={() => deleteAccount.mutate()}
                  >
                    {deleteAccount.isPending && (
                      <Spinner className="mr-2 size-3" />
                    )}
                    {t("dashboard:account.dangerZone.cta")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SettingsCardFooter>
        </SettingsCard>
      </div>
    </>
  );
};
