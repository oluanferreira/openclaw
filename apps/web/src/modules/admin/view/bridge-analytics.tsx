"use client";

import { useState } from "react";

import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";

import { useAdminBridgeAnalytics } from "../hooks/use-admin";

// ─── Types ──────────────────────────────────────────────────────────────

interface DailyPoint {
  date: string;
  connections?: number;
  errors?: number;
}

interface CapItem {
  name: string;
  value: number;
}

interface ActionItem {
  action: string;
  total?: number;
  errors?: number;
}

interface Funnel {
  subscribers: number;
  installed: number;
  weeklyActive: number;
  activeNow: number;
}

interface AnalyticsData {
  dailyConnections: DailyPoint[];
  dailyErrors: DailyPoint[];
  capabilityDistribution: CapItem[];
  actionBreakdown: ActionItem[];
  errorBreakdown: ActionItem[];
  avgHeartbeatMs: number;
  funnel: Funnel;
}

// ─── SVG Charts ─────────────────────────────────────────────────────────

function LineChart({
  data,
  lines,
  height = 200,
}: {
  data: { label: string; values: Record<string, number> }[];
  lines: { key: string; color: string; label: string }[];
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height }}
      >
        Dados insuficientes
      </div>
    );
  }

  const width = 600;
  const pad = { top: 16, right: 16, bottom: 32, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const allVals = data.flatMap((d) => lines.map((l) => d.values[l.key] ?? 0));
  const max = Math.max(...allVals, 1);

  const ticks = 4;
  const yLines = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((max / ticks) * i),
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
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

      {lines.map((line) => {
        const pts = data.map((d, i) => ({
          x: pad.left + (i / (data.length - 1)) * cw,
          y: pad.top + ch - ((d.values[line.key] ?? 0) / max) * ch,
        }));

        let path = `M ${pts[0]!.x} ${pts[0]!.y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[Math.max(i - 1, 0)]!;
          const p1 = pts[i]!;
          const p2 = pts[i + 1]!;
          const p3 = pts[Math.min(i + 2, pts.length - 1)]!;
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }

        return (
          <g key={line.key}>
            <path
              d={path}
              fill="none"
              stroke={line.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {pts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="hsl(var(--background))"
                stroke={line.color}
                strokeWidth="2"
              />
            ))}
          </g>
        );
      })}

      {data.map((d, i) => (
        <text
          key={d.label}
          x={pad.left + (i / (data.length - 1)) * cw}
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

function BarChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number; color?: string }[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height }}
      >
        Sem dados
      </div>
    );
  }

  const width = 600;
  const pad = { top: 16, right: 16, bottom: 40, left: 44 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.min((cw / data.length) * 0.6, 60);
  const gap = cw / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
      {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
        const y = pad.top + ch - frac * ch;
        const val = Math.round(max * frac);
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
              opacity={0.3}
            />
            <text
              x={pad.left - 8}
              y={y + 4}
              textAnchor="end"
              className="fill-muted-foreground"
              fontSize="10"
            >
              {val}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = pad.left + gap * i + (gap - barWidth) / 2;
        const barH = (d.value / max) * ch;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={pad.top + ch - barH}
              width={barWidth}
              height={barH}
              rx={3}
              fill={d.color ?? "hsl(var(--primary))"}
              opacity={0.85}
            />
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize="9"
            >
              {d.label.length > 10 ? d.label.slice(0, 10) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data }: { data: CapItem[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="text-muted-foreground flex h-[180px] items-center justify-center text-sm">
        Sem dados
      </div>
    );
  }

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2, 220 70% 50%))",
    "hsl(var(--chart-3, 160 60% 45%))",
    "hsl(var(--chart-4, 40 80% 55%))",
    "hsl(var(--chart-5, 280 60% 55%))",
  ];

  const cx = 90,
    cy = 90,
    r = 70,
    inner = 45;
  let cumAngle = -Math.PI / 2;

  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + inner * Math.cos(endAngle);
    const iy1 = cy + inner * Math.sin(endAngle);
    const ix2 = cx + inner * Math.cos(startAngle);
    const iy2 = cy + inner * Math.sin(startAngle);

    const large = angle > Math.PI ? 1 : 0;
    const path = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");

    return {
      path,
      color: COLORS[i % COLORS.length]!,
      name: d.name,
      value: d.value,
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 180 180" className="size-[180px] shrink-0">
        {arcs.map((a) => (
          <path key={a.name} d={a.path} fill={a.color} />
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          className="fill-foreground text-2xl font-bold"
          fontSize="24"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          className="fill-muted-foreground"
          fontSize="11"
        >
          total
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {arcs.map((a) => (
          <div key={a.name} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 rounded-sm"
              style={{ backgroundColor: a.color }}
            />
            <span className="capitalize">{a.name}</span>
            <span className="text-muted-foreground ml-auto tabular-nums">
              {a.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelBar({ data }: { data: Funnel }) {
  const steps = [
    {
      label: "Assinantes",
      value: data.subscribers,
      color: "hsl(var(--primary))",
    },
    {
      label: "Bridge Instalado",
      value: data.installed,
      color: "hsl(220, 70%, 50%)",
    },
    {
      label: "Ativos (7d)",
      value: data.weeklyActive,
      color: "hsl(160, 60%, 45%)",
    },
    {
      label: "Online Agora",
      value: data.activeNow,
      color: "hsl(142, 76%, 36%)",
    },
  ];

  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => {
        const pct = Math.max((step.value / max) * 100, 4);
        return (
          <div key={step.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{step.label}</span>
              <span className="font-medium tabular-nums">{step.value}</span>
            </div>
            <div className="bg-muted h-7 w-full overflow-hidden rounded-md">
              <div
                className="flex h-full items-center rounded-md px-2 text-xs font-medium text-white transition-all"
                style={{ width: `${pct}%`, backgroundColor: step.color }}
              >
                {pct > 15 ? `${Math.round((step.value / max) * 100)}%` : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

type Period = 7 | 14 | 30;

export function AdminBridgeAnalytics() {
  const [days, setDays] = useState<Period>(30);
  const { data: raw, isLoading } = useAdminBridgeAnalytics(days);
  const analytics = raw as AnalyticsData | undefined;

  const dailyData = (() => {
    if (!analytics) return [];
    const map = new Map<string, { connections: number; errors: number }>();
    for (const d of analytics.dailyConnections) {
      const key = d.date;
      const entry = map.get(key) ?? { connections: 0, errors: 0 };
      entry.connections = d.connections ?? 0;
      map.set(key, entry);
    }
    for (const d of analytics.dailyErrors) {
      const key = d.date;
      const entry = map.get(key) ?? { connections: 0, errors: 0 };
      entry.errors = d.errors ?? 0;
      map.set(key, entry);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        label: date.slice(5), // MM-DD
        values: { connections: vals.connections, errors: vals.errors },
      }));
  })();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bridge Analytics</h1>
        <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
          {([7, 14, 30] as Period[]).map((p) => (
            <Button
              key={p}
              variant={days === p ? "default" : "ghost"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setDays(p)}
            >
              {p}d
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-20 text-center">
          Carregando...
        </div>
      ) : !analytics ? (
        <div className="text-muted-foreground py-20 text-center">
          Erro ao carregar dados
        </div>
      ) : (
        <>
          {/* Top metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-muted-foreground text-sm font-medium">
                  Bridges Online
                </span>
                <Icons.MonitorSmartphone className="text-muted-foreground size-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {analytics.funnel.activeNow}
                </div>
                <span className="text-muted-foreground text-xs">
                  de {analytics.funnel.installed} instalados
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-muted-foreground text-sm font-medium">
                  Ativos (7d)
                </span>
                <Icons.TrendingUp className="text-muted-foreground size-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {analytics.funnel.weeklyActive}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-muted-foreground text-sm font-medium">
                  Heartbeat Médio
                </span>
                <Icons.Activity className="text-muted-foreground size-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {analytics.avgHeartbeatMs}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <span className="text-muted-foreground text-sm font-medium">
                  Erros ({days}d)
                </span>
                <Icons.AlertTriangle className="text-muted-foreground size-5" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">
                  {analytics.dailyErrors.reduce(
                    (s, d) => s + (d.errors ?? 0),
                    0,
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Connections + Errors line chart */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-sm font-medium">
                    Conexões & Erros
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: "hsl(var(--primary))" }}
                      />
                      Conexões
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2.5 rounded-full bg-red-500" />
                      Erros
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ height: 200 }}>
                  <LineChart
                    data={dailyData}
                    lines={[
                      {
                        key: "connections",
                        color: "hsl(var(--primary))",
                        label: "Conexões",
                      },
                      {
                        key: "errors",
                        color: "hsl(0, 84%, 60%)",
                        label: "Erros",
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Capability donut */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={analytics.capabilityDistribution} />
              </CardContent>
            </Card>
          </div>

          {/* Bottom row */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Actions bar chart */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Ações ({days}d)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 180 }}>
                  <BarChart
                    data={analytics.actionBreakdown.map((a) => ({
                      label: a.action,
                      value: a.total ?? 0,
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Funnel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Funil de Adoção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelBar data={analytics.funnel} />
              </CardContent>
            </Card>
          </div>

          {/* Error breakdown */}
          {analytics.errorBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Erros por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {analytics.errorBreakdown.map((e) => (
                    <div
                      key={e.action}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="text-sm">{e.action}</span>
                      <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
                        {e.errors}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
