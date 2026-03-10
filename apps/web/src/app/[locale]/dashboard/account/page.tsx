import { redirect } from "next/navigation";

import { pathsConfig } from "~/config/paths";
import { getSession } from "~/lib/auth/server";
import { getMetadata } from "~/lib/metadata";
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
