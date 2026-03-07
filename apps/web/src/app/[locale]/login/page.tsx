import { redirect } from "next/navigation";

import { withI18n } from "@workspace/i18n/with-i18n";

import { pathsConfig } from "~/config/paths";
import { getSession } from "~/lib/auth/server";
import { UserLogin } from "~/modules/auth/view/login";

const LoginPage = async () => {
  const { user } = await getSession();

  if (user) {
    return redirect(pathsConfig.dashboard.index);
  }

  return <UserLogin />;
};

export default withI18n(LoginPage);
