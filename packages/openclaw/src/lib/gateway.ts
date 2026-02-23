const INSTANCE_ID_PATTERN = /^[a-z0-9-]+$/;

export const getRequestHost = (headers: Headers) => {
  const instanceHost = headers.get("x-openclaw-instance-host");
  if (instanceHost) {
    return instanceHost.split(",")[0]?.trim().toLowerCase() ?? "";
  }

  const forwardedHost = headers.get("x-forwarded-host");
  if (forwardedHost) {
    return forwardedHost.split(",")[0]?.trim().toLowerCase() ?? "";
  }

  const host = headers.get("host");
  return host?.split(",")[0]?.trim().toLowerCase() ?? "";
};

export const getInstanceIdFromHost = (host: string) => {
  const normalizedHost = host.split(":")[0];
  if (!normalizedHost?.includes(".")) {
    return null;
  }

  const [instanceId] = normalizedHost.split(".");

  if (!instanceId || !INSTANCE_ID_PATTERN.test(instanceId)) {
    return null;
  }

  return instanceId;
};

export const getInstanceIdFromHeaders = (headers: Headers) =>
  getInstanceIdFromHost(getRequestHost(headers));
