import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";

import { handle } from "@workspace/api/utils";
import { Icons } from "@workspace/ui-web/icons";
import { SidebarInset, SidebarProvider } from "@workspace/ui-web/sidebar";

import { pathsConfig } from "~/config/paths";
import { api } from "~/lib/api/server";
import { getSession } from "~/lib/auth/server";
import { getQueryClient } from "~/lib/query/server";
import { DashboardActionBar } from "~/modules/common/layout/dashboard/action-bar";
import { DashboardInset } from "~/modules/common/layout/dashboard/inset";
import { DashboardSidebar } from "~/modules/common/layout/dashboard/sidebar/index";
import { instance } from "~/modules/dashboard/instance/lib/api";

const menu = [
  {
    label: "yourInstance",
    items: [
      {
        title: "overview",
        href: pathsConfig.dashboard.index,
        icon: <Icons.Box />,
      },
    ],
  },
  {
    label: "settings",
    items: [
      {
        title: "account",
        href: "#",
        icon: <Icons.UserRound />,
      },
      {
        title: "subscription",
        href: pathsConfig.dashboard.billing,
        icon: <Icons.CreditCard />,
      },
      {
        title: "apiKeys",
        href: pathsConfig.dashboard.apiKeys,
        icon: <Icons.Webhook />,
      },
    ],
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();

  if (!user) {
    return redirect(pathsConfig.index);
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    ...instance.queries.get,
    queryFn: handle(api.openclaw.$get),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <DashboardSidebar user={user} menu={menu} />
        <SidebarInset>
          <DashboardActionBar menu={menu} />
          <DashboardInset>{children}</DashboardInset>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
