const statusToVariant = {
  created: "secondary",
  stopped: "secondary",
  terminated: "secondary",

  running: "success",
  started: "success",

  creating: "warning",
  starting: "warning",
  provisioning: "warning",
  staging: "warning",
  stopping: "warning",
  suspending: "warning",
  restarting: "warning",
  repairing: "warning",
  paused: "warning",
  suspended: "warning",
  removing: "warning",
  destroying: "warning",
  updating: "warning",
  replacing: "warning",

  exited: "destructive",
  dead: "destructive",
  failed: "destructive",
  launch_failed: "destructive",
  destroyed: "destructive",
  replaced: "destructive",
  migrated: "destructive",
  not_found: "destructive",
} as const;

const startableStatuses = [
  "stopped",
  "terminated",
  "paused",
  "suspended",
  "exited",
  "dead",
  "failed",
  "launch_failed",
  "not_found",
] as const;

const stoppableStatuses = [
  "running",
  "started",
  "starting",
  "restarting",
] as const;

const restartableStatuses = ["running", "started", "starting"] as const;

export const toRawStatusKey = (status: string | null | undefined) =>
  status?.toLowerCase() ?? null;

export const getInstanceStatusBadgeVariant = (
  status: string | null | undefined,
) => {
  const key = toRawStatusKey(status);
  return key && key in statusToVariant
    ? statusToVariant[key as keyof typeof statusToVariant]
    : "secondary";
};

export const canStartInstance = (status: string | null | undefined) => {
  const key = toRawStatusKey(status);
  return key ? startableStatuses.includes(key) : false;
};

export const canStopInstance = (status: string | null | undefined) => {
  const key = toRawStatusKey(status);
  return key ? stoppableStatuses.includes(key) : false;
};

export const canRestartInstance = (status: string | null | undefined) => {
  const key = toRawStatusKey(status);
  return key ? restartableStatuses.includes(key) : false;
};
