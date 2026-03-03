import type { LogEntry } from "./schema";

const DOCKER_LOG_TIMESTAMP_PREFIX =
  /^(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)\s+/;
const ISO_TIMESTAMP_TOKEN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const TIME_TOKEN = /^\d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
const ANSI_ESCAPE_PATTERN =
  // eslint-disable-next-line no-control-regex
  /\u001B(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001B\\))/g;

export const stripAnsi = (value: string) =>
  value.replace(ANSI_ESCAPE_PATTERN, "");

const toTimestampFromToken = (value: string) => {
  if (ISO_TIMESTAMP_TOKEN.test(value) || TIME_TOKEN.test(value)) {
    return value;
  }

  return null;
};

export const parseTextLogLine = (line: string): LogEntry => {
  const normalized = line.trimEnd();
  if (!normalized) {
    return {
      timestamp: null,
      message: "",
    };
  }

  const dockerPrefixMatch = DOCKER_LOG_TIMESTAMP_PREFIX.exec(normalized);
  if (dockerPrefixMatch?.groups?.timestamp) {
    const message = normalized.slice(dockerPrefixMatch[0].length).trimStart();

    return {
      timestamp: dockerPrefixMatch.groups.timestamp,
      message: stripAnsi(message),
    };
  }

  const firstSpaceIndex = normalized.indexOf(" ");
  if (firstSpaceIndex <= 0) {
    return {
      timestamp: null,
      message: stripAnsi(normalized),
    };
  }

  const token = normalized.slice(0, firstSpaceIndex);
  const timestamp = toTimestampFromToken(token);
  if (!timestamp) {
    return {
      timestamp: null,
      message: stripAnsi(normalized),
    };
  }

  return {
    timestamp,
    message: stripAnsi(normalized.slice(firstSpaceIndex + 1)),
  };
};

export const parseTextLogsToEntries = (raw: string, limit = 500): LogEntry[] =>
  raw
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => parseTextLogLine(line))
    .slice(-limit);

export const mergeLogStreamsToEntries = (
  streams: readonly (string | undefined)[],
  limit = 500,
): LogEntry[] =>
  parseTextLogsToEntries(
    streams.filter((stream): stream is string => Boolean(stream)).join("\n"),
    limit,
  );
