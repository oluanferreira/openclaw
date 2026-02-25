"use client";

import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@workspace/i18n";
import { Icons } from "@workspace/ui-web/icons";
import { ScrollArea } from "@workspace/ui-web/scroll-area";
import { Spinner } from "@workspace/ui-web/spinner";

import { instance as instanceApi } from "../lib/api";

interface ParsedLogLine {
  raw: string;
  time: string | null;
  message: string;
}

const DOCKER_LOG_TIMESTAMP_PREFIX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+/;

const parseLogs = (stdout: string) =>
  stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map<ParsedLogLine>((line) => {
      const normalizedLine = line.replace(DOCKER_LOG_TIMESTAMP_PREFIX, "");
      const firstSpaceIndex = normalizedLine.indexOf(" ");
      if (firstSpaceIndex <= 0) {
        return { raw: line, time: null, message: normalizedLine };
      }

      const time = normalizedLine.slice(0, firstSpaceIndex);
      const message = normalizedLine.slice(firstSpaceIndex + 1);

      return { raw: line, time, message };
    });

export const InstanceLogs = () => {
  const { t } = useTranslation(["common", "dashboard"]);

  const logs = useQuery(instanceApi.queries.logs);
  const entries = parseLogs(logs.data?.stdout ?? "");

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
                key={`${entry.raw}-${idx}`}
                className="hover:bg-muted px-3 py-1 @md/dashboard:px-5"
              >
                {entry.time ? (
                  <>
                    <span className="text-muted-foreground">{entry.time} </span>
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
