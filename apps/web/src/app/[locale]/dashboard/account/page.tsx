import { redirect } from "next/navigation";

import { pathsConfig } from "~/config/paths";
import { getMetadata } from "~/lib/metadata";
import { getSession } from "~/lib/auth/server";
import { AccountView } from "~/modules/dashboard/account/view";

export const generateMetadata = getMetadata({
  title: "dashboard:account.home.title",
  description: "dashboard:account.home.description",
});

export default async function AccountPage() {
  const { user } = await getSession();

  if (!user) {
    return redirect(pathsConfig.index);
  }

  return <AccountView user={user} />;
}
