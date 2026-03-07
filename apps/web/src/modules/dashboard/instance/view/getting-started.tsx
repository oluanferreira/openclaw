"use client";

import { useState, useEffect } from "react";

import { useTranslation } from "@workspace/i18n";
import { cn } from "@workspace/ui";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

const STORAGE_KEY = "openclaw-getting-started-dismissed";

const STEP_ICONS = [
  Icons.ExternalLink,
  Icons.MonitorSmartphone,
  Icons.CheckCircle2,
  Icons.MessageCircle,
  Icons.Gift,
];

export const InstanceGettingStarted = ({ instanceUrl }: { instanceUrl: string }) => {
  const { t } = useTranslation("dashboard");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDismissed(stored === "true");
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  const steps: { title: string; description: string }[] = t(
    "instance.gettingStarted.steps",
    { returnObjects: true, instanceUrl },
  ) as { title: string; description: string }[];

  return (
    <Card className="border-primary/20 bg-primary/5 w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.Star className="text-primary size-4" />
          {t("instance.gettingStarted.title")}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={dismiss}
          title={t("instance.gettingStarted.dismiss")}
        >
          <Icons.X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          {t("instance.gettingStarted.subtitle")}
        </p>
        <ol className="flex flex-col gap-3">
          {steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Icons.Circle;
            return (
              <li key={i} className="flex items-start gap-3">
                <div
                  className={cn(
                    "bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex flex-col gap-0.5 pt-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Icon className="size-3.5 shrink-0" />
                    {step.title}
                  </span>
                  <span
                    className="text-muted-foreground [&_.instance-open-link]:text-primary [&_.instance-open-link]:underline [&_.instance-open-link]:font-medium [&_.instance-open-link]:mt-1 [&_.instance-open-link]:inline-flex [&_.instance-open-link]:items-center [&_.instance-open-link]:gap-1 text-xs"
                    dangerouslySetInnerHTML={{ __html: step.description }}
                  />
                </div>
              </li>
            );
          })}
        </ol>
        <Button variant="outline" size="sm" className="mt-1 self-end" onClick={dismiss}>
          {t("instance.gettingStarted.dismiss")}
        </Button>
      </CardContent>
    </Card>
  );
};
