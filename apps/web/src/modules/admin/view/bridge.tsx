/* eslint-disable @typescript-eslint/no-unnecessary-condition, @typescript-eslint/no-unnecessary-type-assertion */
"use client";

import { Fragment, useState } from "react";

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
  useAdminBridge,
  useAdminBridgeStats,
  useAdminBridgeAudit,
  useAdminDisconnectBridge,
} from "../hooks/use-admin";

type StatusFilter = "all" | "connected" | "disconnected";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  connected: "Conectados",
  disconnected: "Desconectados",
};

const CAP_LABELS: Record<string, string> = {
  browser: "Browser",
  terminal: "Terminal",
  clipboard: "Clipboard",
  notifications: "Notif.",
};

function timeAgo(date: string | null): string {
  if (!date) return "Nunca";
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return "Agora";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

export function AdminBridge() {
  const { data: bridges, isLoading } = useAdminBridge();
  const { data: rawStats } = useAdminBridgeStats();
  const stats = rawStats as
    | {
        total: number;
        connectedNow: number;
        popularCapability: string;
        errors24h: number;
      }
    | undefined;
  const disconnect = useAdminDisconnectBridge();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const all = (bridges as any[]) ?? [];
  const filtered = all.filter((b) => {
    if (filter === "connected") return b.connected;
    if (filter === "disconnected") return !b.connected;
    return true;
  });

  const connectedCount = all.filter((b) => b.connected).length;

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Bridge</h1>

      {/* AC3: Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Total Instalados
            </span>
            <Icons.Cable className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Conectados Agora
            </span>
            <Icons.Wifi className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.connectedNow ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Capability Popular
            </span>
            <Icons.Star className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {stats?.popularCapability ?? "-"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Erros (24h)
            </span>
            <Icons.AlertTriangle className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.errors24h ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {FILTER_LABELS[f]}
            {f === "connected" && connectedCount > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {connectedCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* AC1: Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Icons.Loader2 className="text-muted-foreground size-6 animate-spin" />
        </div>
      ) : !filtered.length ? (
        <div className="text-muted-foreground py-8 text-center">
          Nenhum bridge encontrado
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead>App Version</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b: any) => (
              <Fragment key={b.id}>
                <TableRow
                  className="cursor-pointer"
                  onClick={() =>
                    setExpanded(expanded === b.instanceId ? null : b.instanceId)
                  }
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{b.userName ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">
                        {b.userEmail ?? b.instanceId?.slice(0, 12)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`size-2 rounded-full ${b.connected ? "bg-green-500" : "bg-gray-400"}`}
                      />
                      {b.connected ? "Connected" : "Disconnected"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(
                        Object.entries(
                          (b.capabilities ?? {}) as Record<string, boolean>,
                        ) as [string, boolean][]
                      ).map(
                        ([key, val]) =>
                          val && (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="text-xs"
                            >
                              {CAP_LABELS[key] ?? key}
                            </Badge>
                          ),
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span title={b.lastSeen ?? ""}>{timeAgo(b.lastSeen)}</span>
                  </TableCell>
                  <TableCell>{b.appVersion ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {b.connected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          disconnect.mutate(b.instanceId);
                        }}
                        disabled={disconnect.isPending}
                      >
                        <Icons.WifiOff className="mr-1 size-4" />
                        Disconnect
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {/* AC2: Expand panel */}
                {expanded === b.instanceId && (
                  <TableRow key={`${b.id}-detail`}>
                    <TableCell colSpan={6} className="bg-muted/50 p-4">
                      <BridgeDetailPanel
                        instanceId={b.instanceId}
                        deviceName={b.deviceName}
                        createdAt={b.createdAt}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function BridgeDetailPanel({
  instanceId,
  deviceName,
  createdAt,
}: {
  instanceId: string;
  deviceName: string | null;
  createdAt: string;
}) {
  const { data: logs, isLoading } = useAdminBridgeAudit(instanceId);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Instance ID</span>
          <div className="font-mono text-xs">{instanceId}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Device</span>
          <div>{deviceName ?? "—"}</div>
        </div>
        <div>
          <span className="text-muted-foreground">Bridge Since</span>
          <div>{new Date(createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium">Audit Log (last 20)</h4>
        {isLoading ? (
          <Icons.Loader2 className="size-4 animate-spin" />
        ) : !(logs as any[])?.length ? (
          <p className="text-muted-foreground text-sm">Nenhum log</p>
        ) : (
          <div className="max-h-48 overflow-auto rounded border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Result</TableHead>
                  <TableHead className="text-xs">IP</TableHead>
                  <TableHead className="text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {((logs as any[]) ?? []).slice(0, 20).map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{log.action}</TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant={
                          log.result === "success" ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {log.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ipAddress ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.durationMs != null ? `${log.durationMs}ms` : "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {timeAgo(log.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
