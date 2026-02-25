"use client";

import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

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
  const { t } = useTranslation("common");
  const Icon = CommunicationChannelIcon[request.channel];

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
          <Button variant="outline">
            <Icons.Check className="size-4" /> {t("accept")}
          </Button>

          <Button variant="outline">
            <Icons.X className="size-4" /> {t("reject")}
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
  const { t } = useTranslation("common");

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
          <Button variant="outline">
            <Icons.Check className="size-4" />
            {t("accept")}
          </Button>

          <Button variant="outline">
            <Icons.X className="size-4" /> {t("reject")}{" "}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const InstancePairing = () => {
  const { t } = useTranslation("common");
  const { pairing } = usePairing();

  if (!pairing.data) {
    return null;
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="text-muted-foreground flex items-center gap-2 text-sm uppercase">
        {t("pairing")}
        {pairing.isRefetching && <Spinner className="size-3" />}
      </div>
      {pairing.data.map((request) => (
        <div key={request.id}>
          {request.type === "channel" ? (
            <ChannelPairing request={request} />
          ) : (
            <DevicePairing request={request} />
          )}
        </div>
      ))}
    </div>
  );
};
