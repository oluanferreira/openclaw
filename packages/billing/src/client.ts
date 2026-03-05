import { stripeClient } from "@better-auth/stripe/client";

export const plugin = () =>
  stripeClient({
    subscription: true,
  });
