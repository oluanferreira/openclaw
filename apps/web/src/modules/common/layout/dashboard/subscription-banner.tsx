"use client";

import { useTranslation } from "@workspace/i18n";
import { Button } from "@workspace/ui-web/button";
import { Spinner } from "@workspace/ui-web/spinner";

import { useBilling } from "~/modules/dashboard/billing/hooks/use-billing";

export const SubscriptionBanner = () => {
  const { t } = useTranslation("dashboard");
  const { subscription, portal } = useBilling();

  const status = subscription.data?.status;
  if (status !== "past_due") return null;

  const currentPeriodEnd = subscription.data?.currentPeriodEnd;
  const deadline = currentPeriodEnd
    ? new Date(new Date(currentPeriodEnd).getTime() + 3 * 24 * 60 * 60 * 1000)
    : null;

  const now = new Date();
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  let message: string;
  let bgClass: string;

  if (daysLeft <= 0) {
    message = t("billing.banner.overdue", { days: String(Math.abs(daysLeft)) });
    bgClass = "bg-red-600 text-white";
  } else if (daysLeft === 1) {
    message = t("billing.banner.lastDay");
    bgClass = "bg-orange-500 text-white";
  } else {
    message = t("billing.banner.paymentPending", { days: String(daysLeft) });
    bgClass = "bg-yellow-500 text-black";
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 px-4 py-2.5 text-sm font-medium ${bgClass}`}
    >
      <span>{message}</span>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 border-current bg-transparent hover:bg-white/20"
        onClick={() => portal.mutate()}
        disabled={portal.isPending}
      >
        {portal.isPending && <Spinner className="mr-2 size-3" />}
        {t("billing.banner.payNow")}
      </Button>
    </div>
  );
};
