import { getTranslation } from "@workspace/i18n/server";

export const Footer = async () => {
  const { t } = await getTranslation({ ns: "common" });
  return <div>{t("builtWith")}</div>;
};
