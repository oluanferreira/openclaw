"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";
import { Command } from "@workspace/openclaw/cli";
import { Button } from "@workspace/ui-web/button";
import { Card } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { usePairing } from "~/modules/dashboard/instance/hooks/use-pairing";
import { CommunicationChannelIcon } from "~/modules/dashboard/instance/icons";

import { instance as instanceApi } from "../lib/api";

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

  const queryClient = useQueryClient();
  const cli = useMutation({
    ...instanceApi.mutations.cli,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries(instanceApi.queries.pairing);
      if (variables.command === Command.PAIRING_APPROVE) {
        toast.success(t("instance.pairing.channel.approve.success"));
      } else if (variables.command === Command.PAIRING_REJECT) {
        toast.success(t("instance.pairing.channel.reject.success"));
      }
    },
  });

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
              cli.mutate({
                command: Command.PAIRING_APPROVE,
                args: { channel: request.channel, code: request.code },
              })
            }
            disabled={
              cli.isPending && cli.variables.command === Command.PAIRING_APPROVE
            }
          >
            {cli.isPending &&
            cli.variables.command === Command.PAIRING_APPROVE ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.Check className="size-4" />
            )}
            {t("approve")}
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              cli.mutate({
                command: Command.PAIRING_REJECT,
                args: { channel: request.channel, code: request.code },
              })
            }
            disabled={
              cli.isPending && cli.variables.command === Command.PAIRING_REJECT
            }
          >
            {cli.isPending &&
            cli.variables.command === Command.PAIRING_REJECT ? (
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

  const queryClient = useQueryClient();
  const cli = useMutation({
    ...instanceApi.mutations.cli,
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries(instanceApi.queries.pairing);
      if (variables.command === Command.DEVICE_APPROVE) {
        toast.success(t("instance.pairing.device.approve.success"));
      } else if (variables.command === Command.DEVICE_REJECT) {
        toast.success(t("instance.pairing.device.reject.success"));
      }
    },
  });

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
              cli.mutate({
                command: Command.DEVICE_APPROVE,
                args: { id: request.id },
              })
            }
            disabled={
              cli.isPending && cli.variables.command === Command.DEVICE_APPROVE
            }
          >
            {cli.isPending &&
            cli.variables.command === Command.DEVICE_APPROVE ? (
              <Spinner className="size-4" />
            ) : (
              <Icons.Check className="size-4" />
            )}
            {t("approve")}
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              cli.mutate({
                command: Command.DEVICE_REJECT,
                args: { id: request.id },
              })
            }
            disabled={
              cli.isPending && cli.variables.command === Command.DEVICE_REJECT
            }
          >
            {cli.isPending &&
            cli.variables.command === Command.DEVICE_REJECT ? (
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
  const { t } = useTranslation("common");
  const { pairing } = usePairing();

  if (!pairing.data?.length) {
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
