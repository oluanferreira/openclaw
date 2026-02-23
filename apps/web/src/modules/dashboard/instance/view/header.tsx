import { useTranslation } from "@workspace/i18n";
import { Badge } from "@workspace/ui-web/badge";
import { Icons } from "@workspace/ui-web/icons";

import {
  DashboardHeader,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";

import { InstanceActions } from "./actions";
export const InstanceHeader = () => {
  const { t } = useTranslation("common");
  const { instance } = useInstance();

  return (
    <DashboardHeader>
      <div className="flex min-w-0 items-center gap-4">
        <Icons.Box className="size-14" strokeWidth={1.5} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <DashboardHeaderTitle>{t("yourInstance")}</DashboardHeaderTitle>
            <Badge variant="success">{t("running")}</Badge>
          </div>

          <a
            href="#"
            className="text-primary inline-flex items-center gap-1 text-sm underline underline-offset-3 hover:no-underline"
          >
            {instance.data?.id} <Icons.ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
      <InstanceActions />
    </DashboardHeader>
  );
};
