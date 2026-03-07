"use client";

import dayjs from "dayjs";

import { useTranslation } from "@workspace/i18n";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Spinner } from "@workspace/ui-web/spinner";

import {
  DashboardHeader,
  DashboardHeaderTitle,
  DashboardHeaderDescription,
} from "~/modules/common/layout/dashboard/header";
import { useBilling } from "~/modules/dashboard/billing/hooks/use-billing";
import { getDisplayPrice } from "@workspace/shared/constants/pricing";


export const BillingView = () => {
  const { t } = useTranslation("dashboard");
  const { subscription, checkout, portal, currency } = useBilling();

  const status = subscription.data?.status ?? "inactive";
  const isActive = status === "active";
  const statusLabels: Record<string, string> = {
    active: t("billing.status.active"),
    inactive: t("billing.status.inactive"),
    canceled: t("billing.status.canceled"),
    past_due: t("billing.status.past_due"),
  };
  const statusLabel = statusLabels[status] ?? status;

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>{t("billing.title")}</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("billing.description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <section className="flex w-full flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{t("billing.plan")}</span>
          <Badge variant={isActive ? "default" : "secondary"}>
            {statusLabel}
          </Badge>
        </div>

        {isActive && subscription.data?.currentPeriodEnd && (
          <p className="text-muted-foreground text-sm">
            {t("billing.renewsOn", {
              date: dayjs(subscription.data.currentPeriodEnd).format(
                "MMMM D, YYYY",
              ),
            })}
          </p>
        )}

        {isActive ? (
          <Button
            variant="outline"
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
          >
            {portal.isPending && <Spinner className="mr-2 size-4" />}
            {t("billing.manage")}
          </Button>
        ) : (
          <Button
            variant="foreground"
            onClick={() => checkout.mutate()}
            disabled={checkout.isPending}
          >
            {checkout.isPending && <Spinner className="mr-2 size-4" />}
            {t("billing.subscribe")} — {getDisplayPrice(currency)}/{t("billing.perMonth")}
          </Button>
        )}
      </section>
    </>
  );
};
