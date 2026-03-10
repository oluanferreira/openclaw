"use client";

import { useState, useMemo } from "react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui-web/table";

import {
  useAdminSubscriptions,
  useAdminSubscriptionStats,
  useAdminInvoices,
} from "../hooks/use-admin";

type SubscriptionFilter =
  | "all"
  | "active"
  | "inactive"
  | "canceled"
  | "past_due"
  | "expiring";

const statusVariant = (status: string) => {
  switch (status) {
    case "active":
      return "success" as const;
    case "past_due":
      return "warning" as const;
    case "canceled":
    case "inactive":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Ativa";
    case "past_due":
      return "Em atraso";
    case "canceled":
      return "Cancelada";
    case "inactive":
      return "Inativa";
    default:
      return status;
  }
};

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString("pt-BR");
};

const invoiceStatusLabel = (status: string) => {
  switch (status) {
    case "paid":
      return "Pago";
    case "open":
      return "Aberto";
    case "draft":
      return "Rascunho";
    case "void":
      return "Anulado";
    case "uncollectible":
      return "Inadimplente";
    default:
      return status;
  }
};

const FILTER_LABELS: Record<SubscriptionFilter, string> = {
  all: "Todas",
  active: "Ativas",
  inactive: "Inativas",
  canceled: "Canceladas",
  past_due: "Em atraso",
  expiring: "Expirando",
};

const STATUS_FILTERS: SubscriptionFilter[] = [
  "all",
  "active",
  "expiring",
  "inactive",
  "canceled",
  "past_due",
];

const getDaysRemaining = (dateStr: string | null) => {
  if (!dateStr) return null;
  const end = new Date(dateStr).getTime();
  return Math.floor((end - Date.now()) / 86400000);
};

const isExpiringSoon = (sub: any) => {
  if (sub.status !== "active" || !sub.currentPeriodEnd) return false;
  const days = getDaysRemaining(sub.currentPeriodEnd);
  return days !== null && days <= 7;
};

function InvoicesPanel({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const { data: invoices, isLoading } = useAdminInvoices(customerId);

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Faturas</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <Icons.XCircle className="size-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground py-4 text-center text-sm">
            Carregando faturas...
          </div>
        ) : !invoices?.length ? (
          <div className="text-muted-foreground py-4 text-center text-sm">
            Nenhuma fatura encontrada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">
                    {inv.number ?? inv.id.slice(0, 20)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "open"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {invoiceStatusLabel(inv.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(
                      inv.amountPaid ?? inv.amountDue,
                      inv.currency,
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(inv.periodStart)} — {formatDate(inv.periodEnd)}
                  </TableCell>
                  <TableCell>{formatDate(inv.created)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {inv.hostedInvoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(inv.hostedInvoiceUrl, "_blank")
                          }
                        >
                          Ver
                        </Button>
                      )}
                      {inv.invoicePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(inv.invoicePdf, "_blank")}
                        >
                          PDF
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminSubscriptions() {
  const { data: subs, isLoading } = useAdminSubscriptions();
  const { data: stats } = useAdminSubscriptionStats();
  const [filter, setFilter] = useState<SubscriptionFilter>("all");
  const [search, setSearch] = useState("");
  const [invoicesFor, setInvoicesFor] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = subs ?? [];

    if (filter === "expiring") {
      list = list.filter((s: any) => isExpiringSoon(s));
    } else if (filter !== "all") {
      list = list.filter((s: any) => s.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
      list = list.filter(
        (s: any) =>
          s.userName?.toLowerCase().includes(q) ||
          s.userEmail?.toLowerCase().includes(q),
      );
      /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
    }

    return list;
  }, [subs, filter, search]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Carregando assinaturas...
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              MRR
            </span>
            <Icons.TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.mrr.toFixed(2) ?? "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "active" ? "border-primary" : ""}`}
          onClick={() => setFilter(filter === "active" ? "all" : "active")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Ativas
            </span>
            <Icons.CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active ?? 0}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "expiring" ? "border-primary" : ""} ${
            (stats?.expiringIn7Days ?? 0) > 0 && filter !== "expiring"
              ? "border-yellow-500"
              : ""
          }`}
          onClick={() => setFilter(filter === "expiring" ? "all" : "expiring")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Expirando em 7d
            </span>
            <Icons.Clock className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.expiringIn7Days ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Churn (30d)
            </span>
            <Icons.Ban className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentChurn ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              variant={filter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(s)}
            >
              {FILTER_LABELS[s]}
              {s !== "all" && s !== "expiring" && subs && (
                <span className="text-muted-foreground ml-1 text-xs">
                  (
                  {
                    (subs as any[]).filter((sub: any) => sub.status === s)
                      .length
                  }
                  )
                </span>
              )}
              {s === "expiring" && subs && (
                <span className="text-muted-foreground ml-1 text-xs">
                  (
                  {
                    (subs as any[]).filter((sub: any) => isExpiringSoon(sub))
                      .length
                  }
                  )
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Icons.Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            className="pl-8"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {/* Table */}
      {!filtered.length ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Icons.CreditCard className="text-muted-foreground size-10" />
          <div className="text-center">
            <p className="text-muted-foreground text-sm font-medium">
              Nenhuma assinatura encontrada
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {search
                ? "Tente ajustar os termos de busca."
                : filter !== "all"
                  ? "Nenhuma assinatura com esse filtro."
                  : "Nenhuma assinatura cadastrada ainda."}
            </p>
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Cliente Stripe</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((sub: any) => {
              const days = getDaysRemaining(sub.currentPeriodEnd);

              return (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sub.userImage && (
                        <img
                          src={sub.userImage}
                          alt={sub.userName}
                          className="size-6 rounded-full"
                          width={24}
                          height={24}
                        />
                      )}
                      <div>
                        <div className="font-medium">{sub.userName}</div>
                        <div className="text-muted-foreground text-xs">
                          {sub.userEmail}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(sub.status)}>
                      {statusLabel(sub.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sub.currentPeriodEnd ? (
                      <span
                        className={`text-sm font-medium ${
                          days === null
                            ? "text-muted-foreground"
                            : days < 0
                              ? "text-destructive"
                              : days <= 7
                                ? "text-yellow-500"
                                : days <= 30
                                  ? "text-yellow-600"
                                  : "text-green-600"
                        }`}
                      >
                        {days === null
                          ? "—"
                          : days < 0
                            ? `Expirado há ${Math.abs(days)}d`
                            : days === 0
                              ? "Expira hoje"
                              : `${days}d restantes`}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(sub.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    {sub.stripeCustomerId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-mono text-xs"
                        onClick={() =>
                          window.open(
                            `https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`,
                            "_blank",
                          )
                        }
                      >
                        {sub.stripeCustomerId.slice(0, 18)}...
                        <Icons.ArrowUpRight className="ml-1 size-3" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {sub.stripeCustomerId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setInvoicesFor(
                            invoicesFor === sub.stripeCustomerId
                              ? null
                              : sub.stripeCustomerId,
                          )
                        }
                      >
                        <Icons.CreditCard className="mr-1 size-3" />
                        Faturas
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {invoicesFor && (
        <InvoicesPanel
          customerId={invoicesFor}
          onClose={() => setInvoicesFor(null)}
        />
      )}
    </div>
  );
}
