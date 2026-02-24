"use client";

import { useQuery } from "@tanstack/react-query";

import { useTranslation } from "@workspace/i18n";
import { ScrollArea } from "@workspace/ui-web/scroll-area";

import { instance as instanceApi } from "../lib/api";

interface ParsedLogLine {
  raw: string;
  time: string | null;
  message: string;
}

const parseLogs = (stdout: string) =>
  stdout
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map<ParsedLogLine>((line) => {
      const firstSpaceIndex = line.indexOf(" ");
      if (firstSpaceIndex <= 0) {
        return { raw: line, time: null, message: line };
      }

      const time = line.slice(0, firstSpaceIndex);
      const message = line.slice(firstSpaceIndex + 1);

      return { raw: line, time, message };
    });

export const InstanceLogs = () => {
  const { t } = useTranslation(["common", "dashboard"]);

  const logs = useQuery(instanceApi.queries.logs);
  const entries = parseLogs(logs.data?.stdout ?? "");

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col gap-4">
      <span className="text-muted-foreground ml-1 text-sm uppercase">
        {t("logs")}
      </span>
      <ScrollArea className="bg-card min-h-0 w-full flex-1 rounded-2xl border p-0">
        <pre className="py-4 font-mono text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
          {!entries.length ? (
            <div className="text-muted-foreground px-5 py-1">
              {t("instance.logs.loading")}
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={`${entry.raw}-${idx}`}
                className="hover:bg-muted px-5 py-1"
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
