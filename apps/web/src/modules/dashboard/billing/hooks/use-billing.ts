"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";
import { useTranslation } from "@workspace/i18n";

import { api } from "~/lib/api/client";

import { billingApi } from "../lib/api";

export const useBilling = () => {
  const { i18n } = useTranslation();
  const currency: "usd" | "brl" = i18n.language === "pt" ? "brl" : "usd";

  const subscription = useQuery(billingApi.queries.subscription);

  const checkout = useMutation({
    mutationFn: () => {
      const refCookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("ref="))
        ?.split("=")[1];
      return handle(api.billing.checkout.$post)({
        json: { currency, ...(refCookie ? { referralCode: refCookie } : {}) },
      } as never);
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
  });

  const portal = useMutation({
    ...billingApi.mutations.portal,
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
  });

  return { subscription, checkout, portal, currency };
};
