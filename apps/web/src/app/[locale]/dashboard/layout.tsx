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

const agents = [
  "Alexander",
  "Isabella",
  "Benjamin",
  "Gabriella",
  "Nathaniel",
  "Valentina",
  "Sebastian",
  "Anastasia",
  "Christopher",
  "Eleanor",
];

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
    label: "agents",
    items: [
      ...agents.map((agent) => ({
        title: agent,
        href: `#agent-${encodeURIComponent(agent)}`,
        icon: (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${agent}`}
            className="-ml-px size-4.5 rounded-md"
            alt={agent}
            width={16}
            height={16}
          />
        ),
      })),
      {
        title: "addNew",
        href: "#add-new-agent",
        icon: <Icons.Plus />,
      },
    ],
  },
  {
    label: "settings",
    items: [
      {
        title: "account",
        href: "#settings-account",
        icon: <Icons.UserRound />,
      },
      {
        title: "subscription",
        href: "#settings-subscription",
        icon: <Icons.CreditCard />,
      },
      {
        title: "apiKeys",
        href: "#settings-apikeys",
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
