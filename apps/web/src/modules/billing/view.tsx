"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

import { useTranslation } from "@workspace/i18n";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { pathsConfig } from "~/config/paths";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardFooter,
  SettingsCardHeader,
  SettingsCardTitle,
} from "~/modules/common/layout/dashboard/settings-card";

import { billing as billingApi } from "./lib/api";

const getStatusVariant = (
  status?: string,
): React.ComponentProps<typeof Badge>["variant"] => {
  switch (status) {
    case "active":
      return "success";
    case "trialing":
      return "warning";
    case "canceled":
    case "unpaid":
      return "destructive";
    default:
      return "secondary";
  }
};

const SubscriptionField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 rounded-xl border p-3 sm:p-4">
    <span className="text-muted-foreground text-xs font-medium uppercase">
      {label}
    </span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

export const SubscriptionOverview = () => {
  const { t, i18n } = useTranslation("billing");
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const activeSubscription = useQuery(billingApi.queries.active);
  const checkout = useMutation(billingApi.mutations.checkout);
  const portal = useMutation(billingApi.mutations.portal);
  const restore = useMutation({
    ...billingApi.mutations.restore,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: billingApi.queries.active.queryKey,
      });
    },
  });

  const redirectPath = pathname || pathsConfig.dashboard.settings.billing;
  const subscription = activeSubscription.data?.[0];

  const statusLabelMap = {
    active: t("overview.status.active"),
    trialing: t("overview.status.trialing"),
    canceled: t("overview.status.canceled"),
    incomplete: t("overview.status.incomplete"),
    incomplete_expired: t("overview.status.incomplete_expired"),
    past_due: t("overview.status.past_due"),
    paused: t("overview.status.paused"),
    unpaid: t("overview.status.unpaid"),
  } as const;

  const formatDate = (value?: Date | string | null) => {
    if (!value) {
      return t("overview.value.unknown");
    }

    return new Date(value).toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <section className="flex w-full flex-col gap-4">
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>{t("title")}</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <SettingsCard>
        <SettingsCardHeader>
          <SettingsCardTitle>{t("overview.title")}</SettingsCardTitle>
          <SettingsCardDescription>
            {t("overview.description")}
          </SettingsCardDescription>
        </SettingsCardHeader>

        <SettingsCardContent className="space-y-4">
          {!subscription ? (
            <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed p-4 sm:p-5">
              <span className="text-center font-medium">
                {t("overview.empty.title")}
              </span>
              <span className="text-muted-foreground text-center text-sm">
                {t("overview.empty.description")}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SubscriptionField
                label={t("overview.field.plan")}
                value={subscription.plan.toUpperCase()}
              />

              <SubscriptionField
                label={t("overview.field.status")}
                value={
                  <Badge variant={getStatusVariant(subscription.status)}>
                    {statusLabelMap[subscription.status]}
                  </Badge>
                }
              />

              <SubscriptionField
                label={t("overview.field.periodEnd")}
                value={formatDate(subscription.periodEnd)}
              />

              <SubscriptionField
                label={t("overview.field.trialEnd")}
                value={formatDate(subscription.trialEnd)}
              />

              <SubscriptionField
                label={t("overview.field.cancelAt")}
                value={formatDate(subscription.cancelAt)}
              />

              {subscription.cancelAtPeriodEnd ? (
                <div className="bg-warning/10 text-warning rounded-xl border p-3 text-sm sm:col-span-2">
                  {t("overview.note.cancelAtPeriodEnd")}
                </div>
              ) : null}
            </div>
          )}
        </SettingsCardContent>

        <SettingsCardFooter>
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            {!subscription ? (
              <Button
                size="sm"
                variant="foreground"
                onClick={() =>
                  checkout.mutate({
                    successUrl: redirectPath,
                    cancelUrl: redirectPath,
                  })
                }
                disabled={checkout.isPending}
              >
                {checkout.isPending ? (
                  <Spinner />
                ) : (
                  <Icons.CreditCard className="size-4" />
                )}
                {t("action.subscribe")}
              </Button>
            ) : (
              <>
                {subscription.cancelAtPeriodEnd ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-foreground"
                    onClick={() => restore.mutate()}
                    disabled={restore.isPending}
                  >
                    {restore.isPending ? (
                      <Spinner />
                    ) : (
                      <Icons.RotateCcw className="size-4" />
                    )}
                    {t("action.restore")}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="foreground"
                  onClick={() =>
                    portal.mutate({
                      returnUrl: redirectPath,
                    })
                  }
                  disabled={portal.isPending}
                >
                  {portal.isPending ? (
                    <Spinner />
                  ) : (
                    <Icons.ExternalLink className="size-4" />
                  )}
                  {t("action.portal")}
                </Button>
              </>
            )}
          </div>
        </SettingsCardFooter>
      </SettingsCard>
    </section>
  );
};
