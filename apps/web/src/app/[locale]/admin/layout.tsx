import { redirect } from "next/navigation";

import { Icons } from "@workspace/ui-web/icons";
import { SidebarInset, SidebarProvider } from "@workspace/ui-web/sidebar";

import { pathsConfig } from "~/config/paths";
import { getSession } from "~/lib/auth/server";
import { AdminLogin } from "~/modules/admin/view/login";
import { DashboardActionBar } from "~/modules/common/layout/dashboard/action-bar";
import { DashboardSidebar } from "~/modules/common/layout/dashboard/sidebar/index";

import type { Menu } from "~/modules/common/layout/dashboard/sidebar/types";

const ADMIN_EMAILS = ["luanferreira.emp@gmail.com", "luizjuniorbjj@gmail.com"];

const menu: Menu = [
  {
    label: "Admin",
    items: [
      {
        title: "Visão Geral",
        href: pathsConfig.admin.index,
        icon: <Icons.Box />,
      },
      {
        title: "Usuários",
        href: pathsConfig.admin.users,
        icon: <Icons.UsersRound />,
      },
      {
        title: "Instâncias",
        href: pathsConfig.admin.instances,
        icon: <Icons.MonitorSmartphone />,
      },
      {
        title: "Assinaturas",
        href: pathsConfig.admin.subscriptions,
        icon: <Icons.CreditCard />,
      },
      {
        title: "Modelos",
        href: pathsConfig.admin.models,
        icon: <Icons.Bot />,
      },
      {
        title: "Tickets",
        href: pathsConfig.admin.tickets,
        icon: <Icons.LifeBuoy />,
      },
      {
        title: "Referrals",
        href: pathsConfig.admin.referrals,
        icon: <Icons.Gift />,
      },
      {
        title: "Bridge",
        href: pathsConfig.admin.bridge,
        icon: <Icons.Cable />,
      },
    ],
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();

  if (!user) {
    return <AdminLogin />;
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return redirect(pathsConfig.index);
  }

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} menu={menu} />
      <SidebarInset>
        <DashboardActionBar menu={menu} />
        <div className="@container/dashboard flex w-full flex-1 flex-col items-start gap-6 p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
