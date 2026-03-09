"use client";

import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslation } from "@workspace/i18n";

import { referralApi } from "../lib/api";

export const useReferral = () => {
  const { t } = useTranslation("dashboard");
  const queryClient = useQueryClient();

  const me = useQuery(referralApi.queries.me);
  const commissions = useQuery(referralApi.queries.commissions());
  const payouts = useQuery(referralApi.queries.payouts);

  const activate = useMutation({
    ...referralApi.mutations.activate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["referral"] });
      toast.success(t("referral.activate.success"));
    },
    onError: () => {
      toast.error(t("referral.activate.error"));
    },
  });

  const updateWallet = useMutation({
    ...referralApi.mutations.updateWallet,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["referral", "me"] });
      toast.success(t("referral.wallet.updateSuccess"));
    },
    onError: () => {
      toast.error(t("referral.wallet.updateError"));
    },
  });

  return { me, commissions, payouts, activate, updateWallet };
};
