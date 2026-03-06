"use client";

import { Trans, useTranslation } from "@workspace/i18n";
import { ManageInstanceAction } from "@workspace/openclaw";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalClose,
  ModalHeader,
  ModalFooter,
  ModalDescription,
  ModalTitle,
} from "@workspace/ui-web/modal";
import { Skeleton } from "@workspace/ui-web/skeleton";
import { Spinner } from "@workspace/ui-web/spinner";

import { useInstance } from "~/modules/dashboard/instance/hooks/use-instance";
import {
  canStartInstance,
  canStopInstance,
  canRestartInstance,
} from "~/modules/dashboard/instance/lib/status";

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
      {canStartInstance(instanceStatus) && <Start />}
      {canStopInstance(instanceStatus) && <Stop />}
      {canRestartInstance(instanceStatus) && <Restart />}
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
  const { t } = useTranslation(["common", "dashboard"]);
  const { manage } = useInstance();

  return (
    <Modal>
      <ModalTrigger
        render={
          <Button variant="destructive" disabled={manage.isPending}>
            {manage.isPending ? <Spinner /> : <Icons.Trash />}
            {t("destroy")}
          </Button>
        }
      />
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{t("instance.manage.destroy.confirm.title")}</ModalTitle>
          <ModalDescription className="whitespace-pre-line">
            <Trans
              i18nKey="instance.manage.destroy.confirm.description"
              t={t}
              components={{
                b: <span className="font-semibold" />,
              }}
            />
          </ModalDescription>
        </ModalHeader>

        <ModalFooter>
          <ModalClose
            render={<Button variant="outline">{t("cancel")}</Button>}
          />
          <ModalClose
            render={
              <Button
                variant="destructive"
                onClick={() =>
                  manage.mutate({ action: ManageInstanceAction.DESTROY })
                }
                disabled={manage.isPending}
              >
                {t("destroy")}
              </Button>
            }
          />
        </ModalFooter>
      </ModalContent>
    </Modal>
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
