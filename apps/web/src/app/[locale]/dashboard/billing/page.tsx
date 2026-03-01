import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { handle } from "@workspace/api/utils";

import { api } from "~/lib/api/server";
import { getQueryClient } from "~/lib/query/server";
import { billingApi } from "~/modules/dashboard/billing/lib/api";
import { BillingView } from "~/modules/dashboard/billing/view";

export default async function BillingPage() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...billingApi.queries.subscription,
    queryFn: handle(api.billing.subscription["$get"]),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BillingView />
    </HydrationBoundary>
  );
}
