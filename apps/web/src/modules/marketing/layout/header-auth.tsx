import { cn } from "@workspace/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui-web/avatar";
import { buttonVariants } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";

import { pathsConfig } from "~/config/paths";
import { TurboLink } from "~/modules/common/turbo-link";

import type { User } from "@workspace/auth";

interface HeaderAuthProps {
  user: User | null;
  accessLabel: string;
}

export const HeaderAuth = ({ user, accessLabel }: HeaderAuthProps) => {
  if (user) {
    return (
      <TurboLink
        href={pathsConfig.dashboard.index}
        className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80"
      >
        <Avatar className="size-8">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback>
            <Icons.UserRound className="size-4" />
          </AvatarFallback>
        </Avatar>
      </TurboLink>
    );
  }

  return (
    <TurboLink
      href={pathsConfig.login}
      className={cn(
        buttonVariants({ variant: "foreground", size: "sm" }),
        "rounded-full px-4 text-sm font-medium",
      )}
    >
      {accessLabel}
    </TurboLink>
  );
};
