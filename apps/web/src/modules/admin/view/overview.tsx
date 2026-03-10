"use client";

import { useState } from "react";

import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

import {
  useAdminGrowth,
  useAdminSubscriptionStats,
  useAdminUptime,
  useAdminUsers,
} from "../hooks/use-admin";

function AreaChart({ data }: { data: { label: string; count: number }[] }) {
  if (data.length < 2) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
        Dados insuficientes
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const vals = data.map((d) => d.count);
  const max = Math.max(...vals, 1);

  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * cw,
    y: pad.top + ch - (d.count / max) * ch,
  }));

  // Catmull-Rom to cubic bezier for smooth curves
  let line = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(i + 2, pts.length - 1)]!;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  const lastPt = pts[pts.length - 1]!;
  const firstPt = pts[0]!;
  const area = `${line} L ${lastPt.x} ${pad.top + ch} L ${firstPt.x} ${pad.top + ch} Z`;

  const ticks = 4;
  const yLines = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((max / ticks) * i),
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop
            offset="100%"
            stopColor="hsl(var(--primary))"
            stopOpacity="0.02"
          />
        </linearGradient>
      </defs>

      {yLines.map((tick, i) => {
        const y = pad.top + ch - (tick / max) * ch;
        return (
          <g key={i}>
            <line
              x1={pad.left}
              y1={y}
              x2={width - pad.right}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeDasharray="4 4"
              opacity={0.4}
            />
            <text
              x={pad.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {tick}
            </text>
          </g>
        );
      })}

      <path d={area} fill="url(#areaFill)" />
      <path
        d={line}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="hsl(var(--background))"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />
      ))}

      {data.map((d, i) => (
        <text
          key={d.label}
          x={pts[i]!.x}
          y={height - 8}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="10"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

type GrowthPeriod = "months" | "days";

const MONITOR_STATUS: Record<number, { label: string; className: string }> = {
  0: { label: "Pausado", className: "bg-muted-foreground" },
  1: { label: "Aguardando", className: "bg-yellow-400" },
  2: { label: "Online", className: "bg-green-500" },
  8: { label: "Instável", className: "bg-yellow-500" },
  9: { label: "Offline", className: "bg-red-500" },
};

export function AdminOverview() {
  const { data: growth, isLoading: loadingGrowth } = useAdminGrowth();
  const { data: stats, isLoading: loadingStats } = useAdminSubscriptionStats();
  const { data: users, isLoading: loadingUsers } = useAdminUsers();
  const { data: uptimeData, isLoading: loadingUptime } = useAdminUptime();
  const [period, setPeriod] = useState<GrowthPeriod>("months");

  const loading = loadingGrowth || loadingStats || loadingUsers;

  const chartData =
    period === "months"
      ? (growth?.usersByMonth ?? [])
      : (growth?.usersByDay ?? []);

  // Recent users sorted by newest first
  const recentUsers = [...(users ?? [])]
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="flex w-full flex-col gap-6">
      {/* Header */}
      <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>

      {/* Top metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Total de Usuários
            </span>
            <Icons.UserRound className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : (growth?.totalUsers ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Receita Mensal
            </span>
            <Icons.TrendingUp className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : `$${(stats?.mrr ?? 0).toFixed(2)}`}
            </div>
            {!loading && stats && stats.active > 0 && (
              <span className="text-muted-foreground text-xs">
                {stats.active} assinatura{stats.active !== 1 ? "s" : ""} ativa
                {stats.active !== 1 ? "s" : ""}
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Instâncias Ativas
            </span>
            <Icons.MonitorSmartphone className="text-muted-foreground size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : (growth?.totalInstances ?? 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Recent Activity row */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* User Growth - Area Chart */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm font-medium">
                {period === "months"
                  ? "Crescimento de Usuários (7 meses)"
                  : "Crescimento de Usuários (7 dias)"}
              </span>
              <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
                <Button
                  variant={period === "days" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setPeriod("days")}
                >
                  7d
                </Button>
                <Button
                  variant={period === "months" ? "default" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setPeriod("months")}
                >
                  7m
                </Button>
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : (growth?.totalUsers ?? 0)}{" "}
              <span className="text-muted-foreground text-base font-normal">
                usuários no total
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground flex h-[220px] items-center justify-center">
                Carregando...
              </div>
            ) : (
              <div style={{ height: 220 }}>
                <AreaChart data={chartData} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground text-sm">Carregando...</div>
            ) : recentUsers.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Nenhum usuário ainda
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {recentUsers.map((u: any) => {
                  const hasSub = u.subscription?.status === "active";
                  const date = new Date(u.createdAt);
                  const diff = Math.floor(
                    (Date.now() - date.getTime()) / 86400000,
                  );
                  const when =
                    diff === 0
                      ? "Hoje"
                      : diff === 1
                        ? "Ontem"
                        : date.toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex size-9 items-center justify-center rounded-full">
                          <Icons.UserRound className="text-primary size-4" />
                        </div>
                        <div>
                          <p className="text-sm leading-none font-medium">
                            {u.name ?? "Usuário"}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            {when}
                          </p>
                        </div>
                      </div>
                      <Badge variant={hasSub ? "default" : "secondary"}>
                        {hasSub ? "Ativo" : "Gratuito"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UptimeRobot Monitoring */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Monitoramento (UptimeRobot)
          </CardTitle>
          <Icons.Globe className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          {loadingUptime ? (
            <div className="text-muted-foreground text-sm">Carregando...</div>
          ) : !(uptimeData as any)?.monitors?.length ? (
            <div className="text-muted-foreground text-sm">
              {(uptimeData as any)?.error ?? "Nenhum monitor configurado"}
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {(uptimeData as any).monitors.map((m: any) => {
                const st = MONITOR_STATUS[m.status] ?? MONITOR_STATUS[0]!;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${st.className}`} />
                      <span className="text-sm font-medium">{m.name}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      {m.responseTime != null && (
                        <span>{m.responseTime}ms</span>
                      )}
                      <span>{m.uptimeRatio.toFixed(2)}%</span>
                      <Badge
                        variant={m.status === 2 ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {st.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assinaturas Ativas
            </CardTitle>
            <Icons.CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : (stats?.active ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assinaturas Vendidas
            </CardTitle>
            <Icons.CreditCard className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : (growth?.totalSubs ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-primary-foreground border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-primary-foreground/80 text-sm font-medium">
              Total Faturado
            </CardTitle>
            <Icons.TrendingUp className="text-primary-foreground/80 size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              {loading ? "..." : `R$${(stats?.mrr ?? 0).toFixed(2)}`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
