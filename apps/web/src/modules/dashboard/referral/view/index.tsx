"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Label } from "@workspace/ui-web/label";
import { Skeleton } from "@workspace/ui-web/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui-web/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui-web/table";

import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardFooter,
  SettingsCardHeader,
  SettingsCardTitle,
  SettingsCardDescription,
} from "~/modules/common/layout/dashboard/settings-card";

import { useReferral } from "../hooks/use-referral";

// ─── Helpers ────────────────────────────────────────────────

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

function copyToClipboard(text: string, successMsg: string) {
  void navigator.clipboard
    .writeText(text)
    .then(() => toast.success(successMsg));
}

// ─── Info Tooltip ────────────────────────────────────────────

function CommissionInfoTooltip({ t }: { t: (key: string) => string }) {
  return (
    <Tooltip>
      <TooltipTrigger className="text-muted-foreground hover:text-foreground inline-flex cursor-help transition-colors">
        <Icons.Info className="size-4" />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="start"
        className="max-w-xs space-y-2 p-3"
      >
        <p className="font-medium">{t("referral.home.tooltipTiers")}</p>
        <ul className="list-inside list-disc space-y-0.5 text-xs">
          <li>{t("referral.home.tooltipTier1")}</li>
          <li>{t("referral.home.tooltipTier2")}</li>
          <li>{t("referral.home.tooltipTier3")}</li>
        </ul>
        <p className="text-xs opacity-80">
          {t("referral.home.tooltipRecurring")}
        </p>
        <p className="text-xs opacity-80">{t("referral.home.tooltipPayout")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ─── Activate Form ──────────────────────────────────────────

function ActivateForm({
  onActivate,
  isPending,
  t,
}: {
  onActivate: (wallet: string) => void;
  isPending: boolean;
  t: (key: string) => string;
}) {
  const [wallet, setWallet] = useState("");
  const [accepted, setAccepted] = useState(false);
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(wallet) && accepted;

  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>{t("referral.activate.title")}</SettingsCardTitle>
        <SettingsCardDescription>
          {t("referral.activate.description")}
        </SettingsCardDescription>
      </SettingsCardHeader>
      <SettingsCardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wallet">{t("referral.activate.walletLabel")}</Label>
            <Input
              id="wallet"
              placeholder="0x..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              {t("referral.activate.walletHint")}
            </p>
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span
              dangerouslySetInnerHTML={{
                __html: t("referral.activate.acceptTerms"),
              }}
            />
          </label>
        </div>
      </SettingsCardContent>
      <SettingsCardFooter>
        <Button
          disabled={!isValid || isPending}
          onClick={() => onActivate(wallet)}
        >
          {isPending ? (
            <Icons.Loader2 className="mr-2 size-4 animate-spin" />
          ) : null}
          {t("referral.activate.cta")}
        </Button>
      </SettingsCardFooter>
    </SettingsCard>
  );
}

// ─── Stats Cards ────────────────────────────────────────────

function StatsGrid({
  stats,
  t,
}: {
  stats: {
    available: number;
    pending: number;
    totalEarned: number;
    totalPaid: number;
    activeReferrals: number;
  };
  t: (key: string) => string;
}) {
  const items = [
    {
      label: t("referral.stats.available"),
      value: formatUsd(stats.available),
      icon: <Icons.HandCoins className="size-4" />,
    },
    {
      label: t("referral.stats.pending"),
      value: formatUsd(stats.pending),
      icon: <Icons.Clock className="size-4" />,
    },
    {
      label: t("referral.stats.totalEarned"),
      value: formatUsd(stats.totalEarned),
      icon: <Icons.TrendingUp className="size-4" />,
    },
    {
      label: t("referral.stats.totalPaid"),
      value: formatUsd(stats.totalPaid),
      icon: <Icons.ArrowUpRight className="size-4" />,
    },
    {
      label: t("referral.stats.activeReferrals"),
      value: String(stats.activeReferrals),
      icon: <Icons.UsersRound className="size-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 @lg/dashboard:grid-cols-3 @xl/dashboard:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col gap-1 p-4">
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              {item.icon}
              {item.label}
            </div>
            <p className="text-2xl font-bold tracking-tight">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Referral Link ──────────────────────────────────────────

function ReferralLink({
  code,
  slug,
  t,
}: {
  code: string;
  slug: string | null;
  t: (key: string) => string;
}) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const vanityUrl = slug ? `${baseUrl}/r/${slug}` : `${baseUrl}/r/${code}`;

  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>{t("referral.link.title")}</SettingsCardTitle>
        <SettingsCardDescription>
          {t("referral.link.description")}
        </SettingsCardDescription>
      </SettingsCardHeader>
      <SettingsCardContent>
        <div className="flex items-center gap-2">
          <Input readOnly value={vanityUrl} className="font-mono text-sm" />
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() =>
              copyToClipboard(vanityUrl, t("referral.link.copied"))
            }
          >
            <Icons.Copy className="size-4" />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `https://wa.me/?text=${encodeURIComponent(vanityUrl)}`,
                "_blank",
              )
            }
          >
            WhatsApp
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(vanityUrl)}`,
                "_blank",
              )
            }
          >
            X
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(vanityUrl)}`,
                "_blank",
              )
            }
          >
            LinkedIn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(
                `mailto:?body=${encodeURIComponent(vanityUrl)}`,
                "_blank",
              )
            }
          >
            Email
          </Button>
        </div>
      </SettingsCardContent>
    </SettingsCard>
  );
}

// ─── Network Tree ───────────────────────────────────────────

type NetworkNode = {
  id: string;
  userName: string | null;
  userEmail: string | null;
  status: string;
  createdAt: string;
  referralCode: string;
  childrenCount: number;
  children: NetworkNode[];
};

function NetworkNodeRow({
  node,
  depth,
  t,
}: {
  node: NetworkNode;
  depth: number;
  t: (key: string) => string;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;

  const tierLabel = depth === 0 ? "T1" : depth === 1 ? "T2" : "T3";

  return (
    <div>
      <div
        className={`hover:bg-muted/50 flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors ${hasChildren ? "cursor-pointer" : ""}`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <div className="flex size-5 shrink-0 items-center justify-center">
          {hasChildren ? (
            <Icons.ChevronRight
              className={`text-muted-foreground size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
            />
          ) : (
            <span className="bg-muted-foreground/30 size-1.5 rounded-full" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {node.userName ?? node.userEmail ?? "?"}
              </span>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {tierLabel}
              </Badge>
              {node.status !== "active" && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  {node.status}
                </Badge>
              )}
              {hasChildren && (
                <span className="text-muted-foreground text-[10px]">
                  {node.children.length} {t("referral.network.directReferrals")}
                  {node.childrenCount > node.children.length && (
                    <>, {node.childrenCount} total</>
                  )}
                </span>
              )}
            </div>
            <div className="text-muted-foreground text-xs">
              {node.userEmail}
              <span className="ml-2">
                {t("referral.network.joinedAt")}{" "}
                {new Date(node.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {open &&
        hasChildren &&
        node.children.map((child) => (
          <NetworkNodeRow key={child.id} node={child} depth={depth + 1} t={t} />
        ))}
    </div>
  );
}

function NetworkPanel({
  items,
  t,
}: {
  items: NetworkNode[];
  t: (key: string) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t("referral.network.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {items.map((node) => (
        <NetworkNodeRow key={node.id} node={node} depth={0} t={t} />
      ))}
    </div>
  );
}

// ─── Commissions Table ──────────────────────────────────────

const tierLabels: Record<string, string> = {
  tier1: "Tier 1 (20%)",
  tier2: "Tier 2 (8%)",
  tier3: "Tier 3 (2%)",
};

const statusVariant: Record<
  string,
  "default" | "success" | "warning" | "destructive"
> = {
  pending: "warning",
  paid: "success",
  voided: "destructive",
};

function CommissionsTable({
  items,
  t,
}: {
  items: Array<{
    id: string;
    commissionAmount: string;
    commissionAmountUsd: string | null;
    currency: string;
    tier: string;
    status: string;
    periodMonth: string;
    createdAt: string;
  }>;
  t: (key: string) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t("referral.commissions.empty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("referral.commissions.date")}</TableHead>
            <TableHead>{t("referral.commissions.period")}</TableHead>
            <TableHead>{t("referral.commissions.tier")}</TableHead>
            <TableHead>{t("referral.commissions.amount")}</TableHead>
            <TableHead>{t("referral.commissions.status")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-sm">
                {new Date(c.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm">{c.periodMonth}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {tierLabels[c.tier] ?? c.tier}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {c.commissionAmountUsd ? (
                  <>
                    ${Number(c.commissionAmountUsd).toFixed(2)}
                    <span className="text-muted-foreground ml-1.5 text-xs">
                      ({c.currency.toUpperCase()}{" "}
                      {Number(c.commissionAmount).toFixed(2)})
                    </span>
                  </>
                ) : (
                  `$${Number(c.commissionAmount).toFixed(2)}`
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[c.status] ?? "default"}>
                  {t(`referral.commissions.statusLabel.${c.status}`)}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Payouts Table ──────────────────────────────────────────

const payoutStatusVariant: Record<
  string,
  "default" | "success" | "warning" | "destructive"
> = {
  pending: "warning",
  paid: "success",
  failed: "destructive",
};

function PayoutsTable({
  items,
  t,
}: {
  items: Array<{
    id: string;
    amountUsdt: string;
    periodMonth: string;
    status: string;
    txHash: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
  t: (key: string) => string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t("referral.payouts.empty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("referral.payouts.period")}</TableHead>
            <TableHead>{t("referral.payouts.amount")}</TableHead>
            <TableHead>{t("referral.payouts.status")}</TableHead>
            <TableHead>{t("referral.payouts.txHash")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="text-sm">{p.periodMonth}</TableCell>
              <TableCell className="font-mono text-sm">
                ${Number(p.amountUsdt).toFixed(2)} USDT
              </TableCell>
              <TableCell>
                <Badge variant={payoutStatusVariant[p.status] ?? "default"}>
                  {t(`referral.payouts.statusLabel.${p.status}`)}
                </Badge>
              </TableCell>
              <TableCell>
                {p.txHash ? (
                  <a
                    href={`https://bscscan.com/tx/${p.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1 font-mono text-xs hover:underline"
                  >
                    {p.txHash.slice(0, 10)}...
                    <Icons.ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Wallet Card ────────────────────────────────────────────

function WalletCard({
  currentWallet,
  onUpdate,
  isPending,
  t,
}: {
  currentWallet: string | null;
  onUpdate: (wallet: string) => void;
  isPending: boolean;
  t: (key: string) => string;
}) {
  const [wallet, setWallet] = useState(currentWallet ?? "");
  const [editing, setEditing] = useState(false);
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(wallet);

  return (
    <SettingsCard>
      <SettingsCardHeader>
        <SettingsCardTitle>{t("referral.wallet.title")}</SettingsCardTitle>
        <SettingsCardDescription>
          {t("referral.wallet.description")}
        </SettingsCardDescription>
      </SettingsCardHeader>
      <SettingsCardContent>
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="0x..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              disabled={!isValid || isPending}
              onClick={() => {
                onUpdate(wallet);
                setEditing(false);
              }}
            >
              {t("referral.wallet.save")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setWallet(currentWallet ?? "");
                setEditing(false);
              }}
            >
              {t("referral.wallet.cancel")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <code className="bg-muted rounded px-2 py-1 text-sm">
              {currentWallet ?? t("referral.wallet.notSet")}
            </code>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => setEditing(true)}
            >
              <Icons.Pencil className="size-4" />
            </Button>
          </div>
        )}
      </SettingsCardContent>
    </SettingsCard>
  );
}

// ─── Main View ──────────────────────────────────────────────

export const ReferralView = () => {
  const { t } = useTranslation("dashboard");
  const { me, commissions, payouts, network, activate, updateWallet } =
    useReferral();

  if (me.isLoading) {
    return (
      <>
        <DashboardHeader>
          <div>
            <DashboardHeaderTitle>
              {t("referral.home.title")}
            </DashboardHeaderTitle>
          </div>
        </DashboardHeader>
        <div className="flex w-full flex-col gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }

  const data = me.data as
    | { active: false }
    | {
        active: true;
        referralCode: string;
        referralSlug: string | null;
        walletAddress: string | null;
        status: string;
        activatedAt: string;
        stats: {
          available: number;
          pending: number;
          totalEarned: number;
          totalPaid: number;
          activeReferrals: number;
        };
      };

  // Not activated yet — show activation form
  if (!data?.active) {
    return (
      <>
        <DashboardHeader>
          <div>
            <DashboardHeaderTitle>
              {t("referral.home.title")}
            </DashboardHeaderTitle>
            <DashboardHeaderDescription>
              <span className="inline-flex items-center gap-1.5">
                {t("referral.home.description")}
                <CommissionInfoTooltip t={t as (k: string) => string} />
              </span>
            </DashboardHeaderDescription>
          </div>
        </DashboardHeader>
        <div className="flex w-full flex-col gap-4">
          <ActivateForm
            onActivate={(wallet) => {
              const refCookie = document.cookie
                .split("; ")
                .find((c) => c.startsWith("ref="))
                ?.split("=")[1];
              activate.mutate({
                walletAddress: wallet,
                acceptedTerms: true,
                ...(refCookie ? { parentReferralCode: refCookie } : {}),
              });
            }}
            isPending={activate.isPending}
            t={t as (k: string) => string}
          />
        </div>
      </>
    );
  }

  // Activated — show full dashboard
  const commissionsData =
    (
      commissions.data as {
        items: Array<{
          id: string;
          commissionAmount: string;
          commissionAmountUsd: string | null;
          currency: string;
          tier: string;
          status: string;
          periodMonth: string;
          createdAt: string;
        }>;
      }
    )?.items ?? [];

  const payoutsData =
    (
      payouts.data as {
        items: Array<{
          id: string;
          amountUsdt: string;
          periodMonth: string;
          status: string;
          txHash: string | null;
          paidAt: string | null;
          createdAt: string;
        }>;
      }
    )?.items ?? [];

  const networkData = (network.data as { items: NetworkNode[] })?.items ?? [];

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>
            {t("referral.home.title")}
          </DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("referral.home.description")}
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>

      <div className="flex w-full flex-col gap-6">
        {/* Stats */}
        <StatsGrid stats={data.stats} t={t as (k: string) => string} />

        {/* Referral Link + Share */}
        <ReferralLink
          code={data.referralCode}
          slug={data.referralSlug}
          t={t as (k: string) => string}
        />

        {/* Network Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icons.UsersRound className="size-4" />
              {t("referral.network.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkPanel items={networkData} t={t as (k: string) => string} />
          </CardContent>
        </Card>

        {/* Wallet */}
        <WalletCard
          currentWallet={data.walletAddress}
          onUpdate={(w) => updateWallet.mutate(w)}
          isPending={updateWallet.isPending}
          t={t as (k: string) => string}
        />

        {/* Commissions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("referral.commissions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <CommissionsTable
              items={commissionsData}
              t={t as (k: string) => string}
            />
          </CardContent>
        </Card>

        {/* Payouts */}
        <Card>
          <CardHeader>
            <CardTitle>{t("referral.payouts.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <PayoutsTable items={payoutsData} t={t as (k: string) => string} />
          </CardContent>
        </Card>
      </div>
    </>
  );
};
