"use client";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMemo } from "react";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Card } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { usePairing } from "~/modules/dashboard/instance/hooks/use-pairing";
import { CommunicationChannelIcon } from "~/modules/dashboard/instance/icons";

import type { PairingRequest } from "@workspace/openclaw/config";

dayjs.extend(duration);
dayjs.extend(relativeTime);

function formatRelativeToNow(date: Date): string {
  const diffMs = dayjs().diff(dayjs(date));
  return dayjs.duration(-diffMs).humanize(true);
}

const ChannelPairing = ({
  request,
}: {
  request: Extract<PairingRequest, { type: "channel" }>;
}) => {
  const { t } = useTranslation(["common", "dashboard"]);
  const Icon = CommunicationChannelIcon[request.channel];

  const { channels } = usePairing();

  return (
    <Card className="flex flex-wrap items-start gap-4 p-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Icon className="size-9 shrink-0" />

        <div>
          {"firstName" in request.meta &&
            typeof request.meta.firstName === "string" &&
            "lastName" in request.meta &&
            typeof request.meta.lastName === "string" && (
              <span>
                {request.meta.firstName} {request.meta.lastName}
              </span>
            )}
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            {request.id} • {request.code}
          </span>
        </div>
      </div>
      <div className="ml-auto flex flex-1 items-center justify-end gap-4">
        <span className="text-muted-foreground truncate text-right text-xs">
          {formatRelativeToNow(request.createdAt)}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              channels.approve.mutate({
                channel: request.channel,
                code: request.code,
              })
            }
            disabled={channels.approve.isPending}
          >
            {channels.approve.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.Check className="size-4" />
            )}
            {t("approve")}
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              channels.reject.mutate({
                channel: request.channel,
                code: request.code,
              })
            }
            disabled={channels.reject.isPending}
          >
            {channels.reject.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.X className="size-4" />
            )}
            {t("reject")}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const DevicePairing = ({
  request,
}: {
  request: Extract<PairingRequest, { type: "device" }>;
}) => {
  const { t } = useTranslation(["common", "dashboard"]);

  const { devices } = usePairing();

  return (
    <Card className="flex flex-wrap items-start gap-4 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <Icons.LaptopMinimalCheck
          className="size-9 shrink-0"
          strokeWidth={1.5}
        />

        <div className="flex min-w-0 flex-col gap-1 py-1">
          <span className="min-w-0 truncate leading-none">
            {request.platform} • {request.clientMode} • {request.clientId}
          </span>
          <span className="text-muted-foreground text-xs">{request.id}</span>
        </div>
      </div>

      <div className="ml-auto flex items-center justify-end gap-4">
        <span className="text-muted-foreground truncate text-right text-xs">
          {formatRelativeToNow(request.createdAt)}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              devices.approve.mutate({
                id: request.id,
              })
            }
            disabled={devices.approve.isPending}
          >
            {devices.approve.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.Check className="size-4" />
            )}
            {t("approve")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              devices.reject.mutate({
                id: request.id,
              })
            }
            disabled={devices.reject.isPending}
          >
            {devices.reject.isPending ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.X className="size-4" />
            )}
            {t("reject")}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const InstancePairing = () => {
  const { t } = useTranslation(["common", "dashboard"]);
  const { devices, channels } = usePairing();

  const requests = useMemo(
    () =>
      [...(devices.query.data ?? []), ...(channels.query.data ?? [])].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      ),
    [devices.query.data, channels.query.data],
  );

  const isLoading =
    channels.query.isLoading ||
    channels.query.isRefetching ||
    devices.query.isLoading ||
    devices.query.isRefetching;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="text-muted-foreground flex items-center text-sm">
        <span className="ml-1 flex items-center gap-2 uppercase">
          {t("pairing")}
        </span>

        <Button
          variant="ghost"
          size="icon-xs"
          className="rounded-lg"
          disabled={isLoading}
          onClick={() => {
            void Promise.all([
              channels.query.refetch(),
              devices.query.refetch(),
            ]);
          }}
        >
          {isLoading ? (
            <Spinner className="size-3" />
          ) : (
            <Icons.RotateCcw className="size-3" />
          )}
          <span className="sr-only"> {t("refresh")}</span>
        </Button>
      </div>
      {requests.length > 0 ? (
        requests.map((request) => (
          <div key={request.id}>
            {request.type === "channel" ? (
              <ChannelPairing request={request} />
            ) : (
              <DevicePairing request={request} />
            )}
          </div>
        ))
      ) : (
        <div className="flex items-center justify-center rounded-2xl border p-4 py-10">
          <span className="text-muted-foreground text-sm">
            {t("instance.pairing.empty")}
          </span>
        </div>
      )}
    </div>
  );
};
