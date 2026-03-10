"use client";

import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { toast } from "sonner";

import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent, CardHeader } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui-web/table";

import {
  useAdminReferrals,
  useAdminReferralStats,
  useAdminReferralCommissions,
  useAdminUpdateReferralStatus,
} from "~/modules/admin/hooks/use-admin";

// ─── Types ──────────────────────────────────────────────────

type Affiliate = {
  id: string;
  userId: string;
  referralCode: string;
  referralSlug: string;
  walletAddress: string | null;
  status: string;
  parentAffiliateId: string | null;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  referralCount: number;
  commissionCount: number;
};

type ReferralStats = {
  totalAffiliates: number;
  active: number;
  suspended: number;
  totalEarned: number;
  pendingAmount: number;
  paidAmount: number;
  totalCommissions: number;
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
};

type Commission = {
  id: string;
  referredUserId: string;
  stripeInvoiceId: string;
  grossAmount: string;
  commissionAmount: string;
  grossAmountUsd: string | null;
  commissionAmountUsd: string | null;
  currency: string;
  tier: string;
  status: string;
  periodMonth: string;
  createdAt: string;
  referredName: string | null;
  referredEmail: string | null;
};

// ─── Helpers ────────────────────────────────────────────────

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

const statusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "default" as const;
    case "suspended":
      return "secondary" as const;
    case "banned":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const commissionStatusVariant = (status: string) => {
  switch (status) {
    case "paid":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "voided":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
};

const tierLabel: Record<string, string> = {
  tier1: "T1 (20%)",
  tier2: "T2 (8%)",
  tier3: "T3 (2%)",
};

// ─── Tree helpers ───────────────────────────────────────────

type TreeNode = Affiliate & { children: TreeNode[] };

function buildTree(affiliates: Affiliate[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const a of affiliates) {
    map.set(a.id, { ...a, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const node of map.values()) {
    if (node.parentAffiliateId && map.has(node.parentAffiliateId)) {
      map.get(node.parentAffiliateId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function countDescendants(node: TreeNode, maxDepth = 50): number {
  if (maxDepth <= 0) return 0;
  let count = node.children.length;
  for (const child of node.children) {
    count += countDescendants(child, maxDepth - 1);
  }
  return count;
}

// ─── Main View ──────────────────────────────────────────────

export function AdminReferrals() {
  const { data: affiliates, isLoading } = useAdminReferrals();
  const { data: stats } = useAdminReferralStats();
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "tree">("table");

  const typedAffiliates = (affiliates ?? []) as Affiliate[];
  const typedStats = stats as ReferralStats | undefined;

  const filtered =
    filter === "all"
      ? typedAffiliates
      : typedAffiliates.filter((a) => a.status === filter);

  const tree = useMemo(() => buildTree(typedAffiliates), [typedAffiliates]);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Referrals</h1>
        <div className="flex gap-1 rounded-md border p-0.5">
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-7 px-2.5"
          >
            <Icons.Menu className="mr-1.5 size-3.5" />
            Lista
          </Button>
          <Button
            variant={viewMode === "tree" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("tree")}
            className="h-7 px-2.5"
          >
            <Icons.Globe className="mr-1.5 size-3.5" />
            Rede
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {typedStats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatsCard
            label="Afiliados"
            value={String(typedStats.totalAffiliates)}
            sub={`${typedStats.active} ativos`}
          />
          <StatsCard
            label="Total Ganho"
            value={formatUsd(typedStats.totalEarned)}
            sub={`${typedStats.totalCommissions} comissoes`}
          />
          <StatsCard
            label="Pendente"
            value={formatUsd(typedStats.pendingAmount)}
            sub="aguardando payout"
          />
          <StatsCard
            label="Pago"
            value={formatUsd(typedStats.paidAmount)}
            sub="total sacado"
          />
          <StatsCard
            label="Por Tier"
            value={`${typedStats.tier1Count}/${typedStats.tier2Count}/${typedStats.tier3Count}`}
            sub="T1 / T2 / T3"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icons.Loader2 className="size-6 animate-spin" />
        </div>
      ) : viewMode === "tree" ? (
        /* ─── Tree View ─── */
        <div className="flex flex-col gap-1">
          {tree.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhum afiliado encontrado.
            </p>
          ) : (
            tree.map((node) => (
              <TreeNodeRow key={node.id} node={node} depth={0} />
            ))
          )}
        </div>
      ) : (
        /* ─── Table View ─── */
        <>
          {/* Filters */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "Todos" },
              { key: "active", label: "Ativos" },
              { key: "suspended", label: "Suspensos" },
              { key: "banned", label: "Banidos" },
            ].map((f) => (
              <Button
                key={f.key}
                variant={filter === f.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.key)}
              >
                {f.label}
                {f.key !== "all" && (
                  <Badge variant="secondary" className="ml-1.5">
                    {
                      typedAffiliates.filter((a) =>
                        f.key === "all" ? true : a.status === f.key,
                      ).length
                    }
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Nenhum afiliado encontrado.
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Referrals</TableHead>
                    <TableHead className="text-right">Ganho</TableHead>
                    <TableHead className="text-right">Pendente</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <AffiliateRow
                      key={a.id}
                      affiliate={a}
                      isExpanded={expandedId === a.id}
                      onToggle={() =>
                        setExpandedId(expandedId === a.id ? null : a.id)
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Stats Card ─────────────────────────────────────────────

function StatsCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted-foreground text-xs">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ─── Tree Node ──────────────────────────────────────────────

function TreeNodeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth === 0);
  const updateStatus = useAdminUpdateReferralStatus();
  const hasChildren = node.children.length > 0;
  const totalDescendants = useMemo(() => countDescendants(node), [node]);

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = node.status === "active" ? "suspended" : "active";
    updateStatus.mutate({ id: node.id, status: newStatus });
  };

  return (
    <div>
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        {/* Expand/collapse or leaf indicator */}
        <div className="flex size-5 shrink-0 items-center justify-center">
          {hasChildren ? (
            <Icons.ChevronRight
              className={`text-muted-foreground size-3.5 transition-transform ${open ? "rotate-90" : ""}`}
            />
          ) : (
            <span className="bg-muted-foreground/30 size-1.5 rounded-full" />
          )}
        </div>

        {/* User info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">
                {node.userName ?? node.userEmail ?? "?"}
              </span>
              <Badge
                variant={statusVariant(node.status)}
                className="px-1.5 py-0 text-[10px]"
              >
                {node.status}
              </Badge>
              {hasChildren && (
                <span className="text-muted-foreground text-[10px]">
                  {node.children.length} direto
                  {node.children.length !== 1 ? "s" : ""}
                  {totalDescendants > node.children.length && (
                    <>, {totalDescendants} total</>
                  )}
                </span>
              )}
            </div>
            <div className="text-muted-foreground flex items-center gap-3 text-xs">
              <span>{node.userEmail}</span>
              <span className="font-mono">{node.referralCode}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <p className="text-muted-foreground">Referrals</p>
              <p className="font-mono font-medium">{node.referralCount}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Ganho</p>
              <p className="font-mono font-medium">
                {formatUsd(node.totalCommissions)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Pendente</p>
              <p className="font-mono font-medium">
                {formatUsd(node.pendingCommissions)}
              </p>
            </div>
            {node.walletAddress && (
              <div
                className="hover:bg-muted/50 cursor-pointer rounded px-1 text-right transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  void navigator.clipboard
                    .writeText(node.walletAddress!)
                    .then(() => toast.success("Wallet copiada!"));
                }}
                title="Copiar wallet"
              >
                <p className="text-muted-foreground">Wallet</p>
                <p className="font-mono">
                  {node.walletAddress.slice(0, 6)}...
                  {node.walletAddress.slice(-4)}
                </p>
              </div>
            )}
            <span className="text-muted-foreground">
              {dayjs(node.createdAt).format("DD/MM/YY")}
            </span>
          </div>

          {/* Actions */}
          <Button
            variant="ghost"
            size="sm"
            className="size-7 shrink-0 p-0"
            onClick={toggleStatus}
            disabled={updateStatus.isPending}
            title={node.status === "active" ? "Suspender" : "Ativar"}
          >
            {node.status === "active" ? (
              <Icons.Ban className="size-3.5" />
            ) : (
              <Icons.Check className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Children */}
      {open &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}

// ─── Affiliate Row (Table View) ─────────────────────────────

function AffiliateRow({
  affiliate: a,
  isExpanded,
  onToggle,
}: {
  affiliate: Affiliate;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const updateStatus = useAdminUpdateReferralStatus();

  const toggleStatus = () => {
    const newStatus = a.status === "active" ? "suspended" : "active";
    updateStatus.mutate({ id: a.id, status: newStatus });
  };

  return (
    <>
      <TableRow className="cursor-pointer" onClick={onToggle}>
        <TableCell>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {a.userName ?? "\u2014"}
            </span>
            <span className="text-muted-foreground text-xs">{a.userEmail}</span>
          </div>
        </TableCell>
        <TableCell>
          <code className="text-xs">{a.referralCode}</code>
        </TableCell>
        <TableCell>
          <span className="text-xs">{a.referralSlug}</span>
        </TableCell>
        <TableCell className="text-right font-mono text-sm">
          {a.referralCount}
        </TableCell>
        <TableCell className="text-right font-mono text-sm">
          {formatUsd(a.totalCommissions)}
        </TableCell>
        <TableCell className="text-right font-mono text-sm">
          {formatUsd(a.pendingCommissions)}
        </TableCell>
        <TableCell>
          {a.walletAddress ? (
            <code
              className="hover:bg-muted/50 cursor-pointer rounded px-1 text-xs transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard
                  .writeText(a.walletAddress!)
                  .then(() => toast.success("Wallet copiada!"));
              }}
              title="Copiar wallet"
            >
              {a.walletAddress.slice(0, 6)}...{a.walletAddress.slice(-4)}
            </code>
          ) : (
            <span className="text-muted-foreground text-xs">{"\u2014"}</span>
          )}
        </TableCell>
        <TableCell>
          <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
        </TableCell>
        <TableCell className="text-xs">
          {dayjs(a.createdAt).format("DD/MM/YY")}
        </TableCell>
        <TableCell>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleStatus}
              disabled={updateStatus.isPending}
              title={a.status === "active" ? "Suspender" : "Ativar"}
            >
              {a.status === "active" ? (
                <Icons.Ban className="size-4" />
              ) : (
                <Icons.Check className="size-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={10} className="bg-muted/30 p-0">
            <CommissionsPanel affiliateId={a.id} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Commissions Panel ──────────────────────────────────────

function CommissionsPanel({ affiliateId }: { affiliateId: string }) {
  const { data, isLoading } = useAdminReferralCommissions(affiliateId);
  const comms = (data ?? []) as Commission[];

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Icons.Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (comms.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-center text-xs">
        Nenhuma comissao registrada.
      </p>
    );
  }

  return (
    <div className="p-4">
      <p className="mb-2 text-xs font-semibold">Comissoes ({comms.length})</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Referido</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Bruto</TableHead>
            <TableHead>Comissao</TableHead>
            <TableHead>Periodo</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comms.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs">
                {dayjs(c.createdAt).format("DD/MM/YY HH:mm")}
              </TableCell>
              <TableCell>
                <span className="text-xs">
                  {c.referredEmail ?? c.referredUserId.slice(0, 8)}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {tierLabel[c.tier] ?? c.tier}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {c.grossAmountUsd ? (
                  <span>
                    {formatUsd(Number(c.grossAmountUsd))}
                    <span className="text-muted-foreground ml-1">
                      ({c.currency.toUpperCase()}{" "}
                      {Number(c.grossAmount).toFixed(2)})
                    </span>
                  </span>
                ) : (
                  formatUsd(Number(c.grossAmount))
                )}
              </TableCell>
              <TableCell className="font-mono text-xs font-medium">
                {c.commissionAmountUsd ? (
                  <span>
                    {formatUsd(Number(c.commissionAmountUsd))}
                    <span className="text-muted-foreground ml-1">
                      ({c.currency.toUpperCase()}{" "}
                      {Number(c.commissionAmount).toFixed(2)})
                    </span>
                  </span>
                ) : (
                  formatUsd(Number(c.commissionAmount))
                )}
              </TableCell>
              <TableCell className="text-xs">{c.periodMonth}</TableCell>
              <TableCell>
                <Badge
                  variant={commissionStatusVariant(c.status)}
                  className="text-xs"
                >
                  {c.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
