"use client";

import { useState } from "react";

import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

interface TermsBannerProps {
  onAccept: () => void;
  isPending: boolean;
  t: (key: string) => string;
}

export function TermsBanner({ onAccept, isPending, t }: TermsBannerProps) {
  const [accepted, setAccepted] = useState(false);

  const bullets = [
    t("referral.terms.bullet1"),
    t("referral.terms.bullet2"),
    t("referral.terms.bullet3"),
    t("referral.terms.bullet4"),
    t("referral.terms.bullet5"),
    t("referral.terms.bullet6"),
    t("referral.terms.bullet7"),
  ];

  return (
    <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icons.BookOpen className="size-5 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-900 dark:text-amber-100">
            {t("referral.terms.title")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <ul className="list-inside list-disc space-y-1.5 text-sm text-amber-800 dark:text-amber-200">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <label className="mt-4 flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5"
          />
          <span className="font-medium text-amber-900 dark:text-amber-100">
            {t("referral.terms.checkbox")}
          </span>
        </label>
      </CardContent>
      <CardFooter>
        <Button size="sm" disabled={!accepted || isPending} onClick={onAccept}>
          {isPending ? (
            <Icons.Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          {t("referral.terms.confirm")}
        </Button>
      </CardFooter>
    </Card>
  );
}
