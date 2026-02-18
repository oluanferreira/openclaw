import { createAuthClient } from "@workspace/auth/client/web";
import { ExecutionSide, Platform } from "@workspace/shared/constants";

export const authClient = createAuthClient({
  fetchOptions: {
    headers: {
      "x-client-platform": `${Platform.WEB}-${ExecutionSide.CLIENT}`,
    },
    throw: true,
  },
  plugins: [],
});
