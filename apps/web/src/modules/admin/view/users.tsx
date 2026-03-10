"use client";

import { useState, useMemo } from "react";

import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Card, CardContent, CardHeader } from "@workspace/ui-web/card";
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

import { useAdminUsers, useAdminDeleteUser } from "../hooks/use-admin";

type UserFilter = "all" | "active" | "free" | "with_instance";

const FILTER_LABELS: Record<UserFilter, string> = {
  all: "Todos",
  active: "Ativos",
  free: "Gratuitos",
  with_instance: "Com Instância",
};

const planInfo = (u: any) => {
  const status = u.subscription?.status;
  if (!status || status === "inactive") {
    return { label: "Gratuito", variant: "secondary" as const };
  }
  if (status === "active") {
    return { label: "Ativo", variant: "success" as const };
  }
  if (status === "past_due") {
    return { label: "Em atraso", variant: "warning" as const };
  }
  if (status === "canceled") {
    return { label: "Cancelado", variant: "destructive" as const };
  }
  return { label: status, variant: "secondary" as const };
};

const relativeDate = (dateStr: string) => {
  const diff = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000,
  );
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  if (diff < 7) return `${diff} dias atrás`;
  if (diff < 30) return `${Math.floor(diff / 7)} sem. atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
};

export function AdminUsers() {
  const { data: users, isLoading } = useAdminUsers();
  const deleteUser = useAdminDeleteUser();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");

  const total = users?.length ?? 0;
  const withSub =
    users?.filter((u: any) => u.subscription?.status === "active").length ?? 0;
  const withInstance = users?.filter((u: any) => u.instance?.id).length ?? 0;
  const now = new Date();
  const thisMonth =
    users?.filter((u: any) => {
      const d = new Date(u.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length ?? 0;

  const filtered = useMemo(() => {
    let list = users ?? [];

    if (filter === "active") {
      list = list.filter((u: any) => u.subscription?.status === "active");
    } else if (filter === "free") {
      list = list.filter((u: any) => u.subscription?.status !== "active");
    } else if (filter === "with_instance") {
      list = list.filter((u: any) => u.instance?.id);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u: any) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [users, filter, search]);

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Carregando usuários...
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${filter === "all" ? "border-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Total
            </span>
            <Icons.UsersRound className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "active" ? "border-primary" : ""}`}
          onClick={() => setFilter("active")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Com Assinatura
            </span>
            <Icons.CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withSub}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${filter === "with_instance" ? "border-primary" : ""}`}
          onClick={() => setFilter("with_instance")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Com Instância
            </span>
            <Icons.MonitorSmartphone className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withInstance}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Novos este mês
            </span>
            <Icons.TrendingUp className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonth}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(Object.keys(FILTER_LABELS) as UserFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
              {f !== "all" && (
                <span className="text-muted-foreground ml-1 text-xs">
                  (
                  {f === "active"
                    ? withSub
                    : f === "free"
                      ? total - withSub
                      : withInstance}
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
        <div className="text-muted-foreground py-8 text-center">
          Nenhum usuário encontrado
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Instância</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u: any) => {
              const plan = planInfo(u);
              const expiry = u.subscription?.currentPeriodEnd
                ? new Date(u.subscription.currentPeriodEnd)
                : null;
              const expiryDays = expiry
                ? Math.floor((expiry.getTime() - Date.now()) / 86400000)
                : null;

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt={u.name}
                          className="size-8 rounded-full"
                          width={32}
                          height={32}
                        />
                      ) : (
                        <div className="bg-muted flex size-8 items-center justify-center rounded-full">
                          <Icons.UserRound className="text-muted-foreground size-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm leading-none font-medium">
                          {u.name}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {u.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={plan.variant}>{plan.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.instance?.id ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{u.instance.model}</Badge>
                        <span className="text-muted-foreground text-xs">
                          {u.instance.communicationChannel}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        Sem instância
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {expiry ? (
                      <span
                        className={`text-sm ${
                          expiryDays !== null && expiryDays < 0
                            ? "text-destructive font-medium"
                            : expiryDays !== null && expiryDays < 7
                              ? "font-medium text-yellow-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {expiry.toLocaleDateString("pt-BR")}
                        {expiryDays !== null && expiryDays < 0 && (
                          <span className="ml-1 text-xs">(expirado)</span>
                        )}
                        {expiryDays !== null &&
                          expiryDays >= 0 &&
                          expiryDays < 7 && (
                            <span className="ml-1 text-xs">
                              ({expiryDays}d)
                            </span>
                          )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {relativeDate(u.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {confirmId === u.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteUser.isPending}
                          onClick={() => {
                            deleteUser.mutate(u.id, {
                              onSettled: () => setConfirmId(null),
                            });
                          }}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmId(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmId(u.id)}
                      >
                        <Icons.XCircle className="text-muted-foreground size-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
