"use client";

import { useState } from "react";

import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui-web/table";

import { useAdminSubscriptions, useAdminInvoices } from "../hooks/use-admin";

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
                    {inv.number || inv.id.slice(0, 20)}
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
                      inv.amountPaid || inv.amountDue,
                      inv.currency,
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(inv.periodStart)} —{" "}
                    {formatDate(inv.periodEnd)}
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
                          onClick={() =>
                            window.open(inv.invoicePdf, "_blank")
                          }
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

const FILTER_LABELS: Record<string, string> = {
  all: "Todas",
  active: "Ativas",
  inactive: "Inativas",
  canceled: "Canceladas",
  past_due: "Em atraso",
};

const STATUS_FILTERS = [
  "all",
  "active",
  "inactive",
  "canceled",
  "past_due",
] as const;

export function AdminSubscriptions() {
  const { data: subs, isLoading } = useAdminSubscriptions();
  const [filter, setFilter] = useState<string>("all");
  const [invoicesFor, setInvoicesFor] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Carregando assinaturas...
      </div>
    );
  }

  const filtered =
    filter === "all"
      ? subs ?? []
      : (subs ?? []).filter((s: any) => s.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {FILTER_LABELS[s] ?? s}
            {s !== "all" &&
              subs &&
              ` (${(subs as any[]).filter((sub: any) => sub.status === s).length})`}
          </Button>
        ))}
      </div>

      {!filtered.length ? (
        <div className="text-muted-foreground py-8 text-center">
          Nenhuma assinatura encontrada
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
            {filtered.map((sub: any) => (
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
                  {sub.currentPeriodEnd
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString(
                        "pt-BR",
                      )
                    : "\u2014"}
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
                    <span className="text-muted-foreground">{"\u2014"}</span>
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
            ))}
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
