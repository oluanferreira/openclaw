"use client";

import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@workspace/i18n";
import { Icons } from "@workspace/ui-web/icons";
import { ScrollArea } from "@workspace/ui-web/scroll-area";
import { Spinner } from "@workspace/ui-web/spinner";

import { instance as instanceApi } from "../lib/api";

const FRACTIONAL_SECONDS_PATTERN =
  /\.(?<fraction>\d+)(?<suffix>Z|[+-]\d{2}:\d{2})?$/;

const formatTimestamp = (timestamp: string) => {
  const match = FRACTIONAL_SECONDS_PATTERN.exec(timestamp);
  if (!match?.groups?.fraction) {
    return timestamp;
  }

  const fraction = match.groups.fraction.slice(0, 3).padEnd(3, "0");
  const suffix = match.groups.suffix ?? "";

  return timestamp.replace(FRACTIONAL_SECONDS_PATTERN, `.${fraction}${suffix}`);
};

export const InstanceLogs = () => {
  const { t } = useTranslation(["common", "dashboard"]);

  const logs = useQuery(instanceApi.queries.logs);
  const entries = logs.data ?? [];

  const status = logs.isLoading
    ? { label: t("connecting"), icon: Spinner }
    : logs.isError
      ? logs.isRefetching
        ? { label: t("reconnecting"), icon: Spinner }
        : { label: t("disconnected"), icon: Icons.X }
      : { label: t("connected"), icon: Icons.Check };

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <div className="gap- flex items-center justify-between">
        <span className="text-muted-foreground ml-1 text-sm uppercase">
          {t("logs")}
        </span>
        <div className="text-muted-foreground flex items-center gap-1">
          <span className="text-xs">{status.label}</span>
          <status.icon className="size-3" />
        </div>
      </div>
      <ScrollArea className="bg-card min-h-0 w-full flex-1 rounded-2xl border p-0">
        <pre className="py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap @md/dashboard:py-4 @lg/dashboard:text-sm">
          {!entries.length ? (
            <div className="text-muted-foreground px-3 py-1 @md/dashboard:px-5">
              {t("instance.logs.loading")}
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={`${entry.timestamp ?? "no-ts"}-${entry.message}-${idx}`}
                className="hover:bg-muted px-3 py-1 @md/dashboard:px-5"
              >
                {entry.timestamp ? (
                  <>
                    <span className="text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}{" "}
                    </span>
                    <span>{entry.message}</span>
                  </>
                ) : (
                  <span>{entry.message}</span>
                )}
              </div>
            ))
          )}
        </pre>
      </ScrollArea>
    </section>
  );
};
