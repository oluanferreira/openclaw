import { redirect } from "next/navigation";

import { Icons } from "@workspace/ui-web/icons";
import { SidebarInset, SidebarProvider } from "@workspace/ui-web/sidebar";

import { pathsConfig } from "~/config/paths";
import { getSession } from "~/lib/auth/server";
import { DashboardActionBar } from "~/modules/common/layout/dashboard/action-bar";
import { DashboardInset } from "~/modules/common/layout/dashboard/inset";
import { DashboardSidebar } from "~/modules/common/layout/dashboard/sidebar/index";

const assistants = [
  "Atlas Navigator",
  "Echo Whisper",
  "Nova Insight",
  "Pixel Genius",
  "Orbit Guide",
  "Sage Mentor",
  "Blaze Pathfinder",
  "Vera Visionary",
  "Mira Advisor",
  "Finn Innovator",
];

const menu = [
  {
    label: "assistants",
    items: [
      {
        title: "createNewAssistant",
        href: pathsConfig.dashboard.user.index,
        icon: <Icons.Plus />,
      },
      ...assistants.map((assistant) => ({
        title: assistant,
        href: pathsConfig.dashboard.user.assistants.assistant(assistant),
        icon: (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${assistant}`}
            className="-ml-px size-4.5 rounded-full"
            alt={assistant}
            width={16}
            height={16}
          />
        ),
      })),
    ],
  },
  {
    label: "settings",
    items: [
      {
        title: "account",
        href: pathsConfig.dashboard.user.account,
        icon: <Icons.UserRound />,
      },
      {
        title: "subscription",
        href: pathsConfig.dashboard.user.subscription,
        icon: <Icons.CreditCard />,
      },
      {
        title: "apiKeys",
        href: pathsConfig.dashboard.user.apiKeys,
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

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} menu={menu} />
      <SidebarInset>
        <DashboardActionBar menu={menu} />
        <DashboardInset>{children}</DashboardInset>
      </SidebarInset>
    </SidebarProvider>
  );
}
