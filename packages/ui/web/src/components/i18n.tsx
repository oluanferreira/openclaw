"use client";

import { config, Locale, LocaleLabel, useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";

import type { Icon } from "#components/icons";

import { buttonVariants } from "#components/button";
import { Icons } from "#components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/select";

export const LocaleIcon: Record<Locale, Icon> = {
  [Locale.EN]: Icons.UnitedKingdom,
  [Locale.ES]: Icons.Spain,
} as const;

interface LocaleCustomizerProps {
  readonly className?: string;
  readonly iconClassName?: string;
  readonly onChange?: (lang: Locale) => Promise<void>;
  readonly variant?: "default" | "icon";
  readonly container?: HTMLElement | null;
}

export const LocaleCustomizer = ({
  className,
  iconClassName,
  onChange,
  variant = "default",
  container,
}: LocaleCustomizerProps) => {
  const { i18n, t } = useTranslation("common");
  const locale = i18n.language as Locale;

  const handleLocaleChange = async (locale: Locale | null) => {
    if (!locale) return;
    await onChange?.(locale);
    await i18n.changeLanguage(locale);
  };

  const Icon = LocaleIcon[locale];

  const items = config.locales.map((lang) => ({
    label: (() => {
      const Icon = LocaleIcon[lang];

      return (
        <span className="flex items-center gap-2">
          <Icon className="size-4" />
          {LocaleLabel[lang]}
        </span>
      );
    })(),
    value: lang,
  }));

  return (
    <Select value={locale} onValueChange={handleLocaleChange} items={items}>
      <SelectTrigger
        className={cn(
          {
            "w-full": variant === "default",
          },
          variant === "icon" &&
            cn(
              buttonVariants({
                variant: "ghost",
                size: "icon",
              }),
              "dark:bg-background border-none p-0 shadow-none [&>*:nth-child(2)]:hidden",
            ),
          className,
        )}
        aria-label={t("language.change")}
      >
        {variant === "default" ? (
          <SelectValue aria-label={LocaleLabel[locale]} />
        ) : (
          <SelectValue
            aria-label={LocaleLabel[locale]}
            className="justify-center"
          >
            <Icon className={iconClassName} />
          </SelectValue>
        )}
      </SelectTrigger>
      <SelectContent align="end" portal={{ container }}>
        {items.map((item) => (
          <SelectItem
            key={item.value}
            value={item.value}
            className="cursor-pointer"
          >
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
