"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { memo } from "react";

import { useTranslation } from "@workspace/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui-web/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@workspace/ui-web/dropdown-menu";
import { Icons } from "@workspace/ui-web/icons";
import { SidebarMenuButton, useSidebar } from "@workspace/ui-web/sidebar";
import { Skeleton } from "@workspace/ui-web/skeleton";

import { pathsConfig } from "~/config/paths";
import { auth } from "~/modules/auth/lib/api";
import { TurboLink } from "~/modules/common/turbo-link";

import type { User } from "@workspace/auth";

interface UserNavigationProps {
  readonly user: User;
}

export const UserNavigation = memo<UserNavigationProps>(({ user }) => {
  const { t } = useTranslation(["common", "auth"]);
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();

  const signOut = useMutation({
    ...auth.mutations.signOut,
    onSuccess: () => {
      router.replace(pathsConfig.index);
      router.refresh();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar className="size-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>
                <Icons.UserRound className="w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="grid flex-1 text-left text-sm leading-tight">
              {user.name && (
                <span className="truncate font-medium">{user.name}</span>
              )}
              {user.email && (
                <span className="truncate text-xs">{user.email}</span>
              )}
            </div>
            <Icons.EllipsisVertical className="ml-auto size-4" />
          </SidebarMenuButton>
        }
      />

      <DropdownMenuContent
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2 font-normal">
            <Avatar className="size-8">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>
                <Icons.UserRound className="w-5" />
              </AvatarFallback>
            </Avatar>

            <div className="flex w-full min-w-0 flex-col space-y-1">
              {user.name && (
                <p className="truncate text-sm leading-none font-medium">
                  {user.name}
                </p>
              )}
              {user.email && (
                <p className="text-muted-foreground truncate text-xs leading-none">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <TurboLink
                href={pathsConfig.dashboard.index}
                className="flex w-full cursor-pointer items-center gap-1.5"
                onClick={() => setOpenMobile(false)}
              >
                <Icons.Box className="size-4" />
                {t("yourInstance")}
              </TurboLink>
            }
          />

          <DropdownMenuSeparator />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem
            render={
              <TurboLink
                href={"#"}
                className="flex w-full cursor-pointer items-center gap-1.5"
                onClick={() => setOpenMobile(false)}
              >
                <Icons.Settings className="size-4" />
                {t("account")}
              </TurboLink>
            }
          />
          <DropdownMenuItem
            render={
              <TurboLink
                href={"#"}
                className="flex w-full cursor-pointer items-center gap-1.5"
                onClick={() => setOpenMobile(false)}
              >
                <Icons.CreditCard className="size-4" />
                {t("subscription")}
              </TurboLink>
            }
          />
          <DropdownMenuItem
            render={
              <TurboLink
                href={"#"}
                className="flex w-full cursor-pointer items-center gap-1.5"
                onClick={() => setOpenMobile(false)}
              >
                <Icons.Webhook className="size-4" />
                {t("apiKeys")}
              </TurboLink>
            }
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex w-full cursor-pointer items-center gap-1.5"
          onClick={() => signOut.mutate(undefined)}
        >
          <Icons.LogOut className="size-4" />
          {t("logout.cta")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export const UserNavigationSkeleton = () => {
  return <Skeleton className="size-10 rounded-full" />;
};

UserNavigation.displayName = "UserNavigation";
