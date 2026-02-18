import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@workspace/auth/server";
import { ExecutionSide, Platform } from "@workspace/shared/constants";

const getHeaders = async () => {
  const newHeaders = new Headers(await headers());
  newHeaders.set(
    "x-client-platform",
    `${Platform.WEB}-${ExecutionSide.SERVER}`,
  );
  return newHeaders;
};

export const getSession = cache(async () => {
  const data = await auth.api.getSession({
    headers: await getHeaders(),
  });

  return {
    session: data?.session ?? null,
    user: data?.user ?? null,
  };
});
