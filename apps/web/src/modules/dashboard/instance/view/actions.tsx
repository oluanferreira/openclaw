"use client";

import { useTranslation } from "@workspace/i18n";
import { InstanceStatus, ManageInstanceAction } from "@workspace/openclaw";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";
import { Skeleton } from "@workspace/ui-web/skeleton";
import { Spinner } from "@workspace/ui-web/spinner";

import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";

export const InstanceActions = () => {
  const { status } = useInstance();
  const instanceStatus = status.data?.status;

  if (status.isLoading || !instanceStatus) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[
        InstanceStatus.STOPPED,
        InstanceStatus.PAUSED,
        InstanceStatus.EXITED,
        InstanceStatus.DEAD,
      ].includes(instanceStatus) && <Start />}
      {[
        InstanceStatus.RESTARTING,
        InstanceStatus.STARTING,
        InstanceStatus.RUNNING,
      ].includes(instanceStatus) && (
        <>
          <Stop />
          <Restart />
        </>
      )}
      <Destroy />
    </div>
  );
};

const Stop = () => {
  const { t } = useTranslation("common");
  const { manage } = useInstance();

  return (
    <Button
      variant="secondary"
      onClick={() => manage.mutate({ action: ManageInstanceAction.STOP })}
      disabled={manage.isPending}
    >
      {manage.isPending ? <Spinner /> : <Icons.Square />}
      {t("stop")}
    </Button>
  );
};

const Restart = () => {
  const { t } = useTranslation("common");
  const { manage } = useInstance();

  return (
    <Button
      variant="outline"
      onClick={() => manage.mutate({ action: ManageInstanceAction.RESTART })}
      disabled={manage.isPending}
    >
      {manage.isPending ? <Spinner /> : <Icons.RotateCcw />}
      {t("restart")}
    </Button>
  );
};

const Destroy = () => {
  const { t } = useTranslation("common");
  const { manage } = useInstance();

  return (
    <Button
      variant="destructive"
      onClick={() => manage.mutate({ action: ManageInstanceAction.DESTROY })}
      disabled={manage.isPending}
    >
      {manage.isPending ? <Spinner /> : <Icons.Trash />}
      {t("delete")}
    </Button>
  );
};

const Start = () => {
  const { t } = useTranslation("common");
  const { manage } = useInstance();

  return (
    <Button
      variant="outline"
      onClick={() => manage.mutate({ action: ManageInstanceAction.START })}
      disabled={manage.isPending}
    >
      {manage.isPending ? <Spinner /> : <Icons.Play />}
      {t("start")}
    </Button>
  );
};
