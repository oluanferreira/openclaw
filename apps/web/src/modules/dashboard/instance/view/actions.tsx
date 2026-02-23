"use client";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";

export const InstanceActions = () => {
  const { t } = useTranslation("common");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary">
        <Icons.Square />
        {t("stop")}
      </Button>
      <Button variant="outline">
        <Icons.RotateCcw />
        {t("restart")}
      </Button>
      <Button variant="destructive">
        <Icons.Trash />
        {t("delete")}
      </Button>
    </div>
  );
};
