"use client";

import { useTheme } from "next-themes";

import { useTranslation } from "@workspace/i18n";
import { ThemeMode } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";

export function ThemeSwitcher() {
  const { t } = useTranslation("common");
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === ThemeMode.DARK ? ThemeMode.LIGHT : ThemeMode.DARK);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="group relative"
      onClick={toggleTheme}
    >
      <Icons.Sun className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Icons.Moon className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">{t("theme.toggle")}</span>
    </Button>
  );
}
