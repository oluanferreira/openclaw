import { isKey, useTranslation } from "@workspace/i18n";
import { InstanceStatus } from "@workspace/openclaw";
import { Badge } from "@workspace/ui-web/badge";
import { Icons } from "@workspace/ui-web/icons";

import {
  DashboardHeader,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";

import { InstanceActions } from "./actions";

const statusToVariant = {
  [InstanceStatus.STOPPED]: "secondary",
  [InstanceStatus.RUNNING]: "success",
  [InstanceStatus.STARTING]: "warning",
  [InstanceStatus.STOPPING]: "warning",
  [InstanceStatus.RESTARTING]: "warning",
  [InstanceStatus.REMOVING]: "warning",
  [InstanceStatus.PAUSED]: "warning",
  [InstanceStatus.EXITED]: "destructive",
  [InstanceStatus.DEAD]: "destructive",
} as const;

export const InstanceHeader = () => {
  const { t, i18n } = useTranslation(["common", "dashboard"]);
  const { instance, status } = useInstance();

  const url = `https://${instance.data?.id}.openclaw.turbostarter.dev`;

  const key = `dashboard.instance.status.${status.data?.status}`;
  const variant =
    status.data?.status && status.data.status in statusToVariant
      ? statusToVariant[status.data.status as InstanceStatus]
      : "secondary";

  return (
    <DashboardHeader>
      <div className="flex min-w-0 items-center gap-4">
        <Icons.Box className="size-14" strokeWidth={1.5} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <DashboardHeaderTitle>{t("yourInstance")}</DashboardHeaderTitle>
            {status.data && (
              <Badge variant={variant} className="capitalize">
                {isKey(key, i18n, "dashboard") ? t(key) : status.data.status}
              </Badge>
            )}
          </div>

          <a
            rel="noopener noreferrer"
            target="_blank"
            href={url}
            className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-3 hover:no-underline"
          >
            {url} <Icons.ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
      <InstanceActions />
    </DashboardHeader>
  );
};
