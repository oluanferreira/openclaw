import { stripe } from "@better-auth/stripe";

import { ManageInstanceAction } from "@workspace/openclaw";
import {
  deleteInstance,
  getInstanceByUserId,
  manage,
} from "@workspace/openclaw/server";
import { logger } from "@workspace/shared/logger";

import { env } from "./env";
import { stripe as stripeClient } from "./sdk";
import { Plan } from "./types";

const cleanupInstanceForReferenceId = async (referenceId: string) => {
  const instance = await getInstanceByUserId(referenceId);
  if (!instance) {
    return;
  }

  logger.info(
    `Subscription ended. Removing instance ${instance.id} for reference ${referenceId}`,
  );
  await manage(instance.id, ManageInstanceAction.DESTROY);
  await deleteInstance(instance.id);
};

export const plugin = () =>
  stripe({
    stripeClient,
    stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
    subscription: {
      enabled: true,
      plans: [
        {
          name: Plan.PRO,
          priceId: "price_1Sj3ZjJx7izQuNNxcfUgt149",
          limits: {
            instances: 1,
          },
          freeTrial: {
            days: 3,
            onTrialExpired: async (subscription: { referenceId: string }) => {
              await cleanupInstanceForReferenceId(subscription.referenceId);
            },
          },
        },
      ],
      onSubscriptionDeleted: async ({ subscription }) => {
        await cleanupInstanceForReferenceId(subscription.referenceId);
      },
    },
  });
