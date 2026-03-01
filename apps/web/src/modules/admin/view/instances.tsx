"use client";

import { useState, useMemo } from "react";

import { ManageInstanceAction } from "@workspace/openclaw";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@workspace/ui-web/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui-web/dialog";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Label } from "@workspace/ui-web/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui-web/table";

import {
  useAdminInstances,
  useAdminManageInstance,
  useAdminServersStats,
  useAdminServers,
  useAdminCreateServer,
  useAdminUpdateServer,
  useAdminDeleteServer,
} from "../hooks/use-admin";

type StatusFilter = "all" | "running" | "stopped" | "unknown";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todas",
  running: "Rodando",
  stopped: "Paradas",
  unknown: "Desconhecido",
};

const statusVariant = (status: string | null | undefined) => {
  switch (status) {
    case "running":
      return "success" as const;
    case "stopped":
    case "exited":
    case "dead":
      return "destructive" as const;
    case "starting":
    case "restarting":
    case "stopping":
    case "removing":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "running":
      return "Rodando";
    case "stopped":
      return "Parado";
    case "exited":
      return "Encerrado";
    case "dead":
      return "Morto";
    case "starting":
      return "Iniciando";
    case "restarting":
      return "Reiniciando";
    case "stopping":
      return "Parando";
    case "removing":
      return "Removendo";
    case "unknown":
      return "Desconhecido";
    default:
      return status;
  }
};

const channelLabel = (ch: string) => {
  switch (ch) {
    case "telegram":
      return "Telegram";
    case "whatsapp":
      return "WhatsApp";
    default:
      return ch;
  }
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

const getContainerStatus = (inst: any) =>
  inst.status?.status ?? "unknown";

const isStoppedStatus = (s: string) =>
  ["stopped", "exited", "dead"].includes(s);

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]!;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const progressColor = (percent: number) => {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-yellow-500";
  return "bg-green-500";
};

interface ServerFormData {
  id: string;
  name: string;
  location: string;
  endpoint: string;
  token: string;
}

const emptyServerForm: ServerFormData = {
  id: "",
  name: "",
  location: "",
  endpoint: "local",
  token: "",
};

export function AdminInstances() {
  const { data: instances, isLoading } = useAdminInstances();
  const { data: serversStats } = useAdminServersStats();
  const { data: serversData } = useAdminServers();
  const manageInstance = useAdminManageInstance();
  const createServer = useAdminCreateServer();
  const updateServer = useAdminUpdateServer();
  const deleteServer = useAdminDeleteServer();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [vpsFilter, setVpsFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [confirmDestroy, setConfirmDestroy] = useState<string | null>(null);

  // Server CRUD dialog state
  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [serverDialogMode, setServerDialogMode] = useState<"create" | "edit">("create");
  const [serverForm, setServerForm] = useState<ServerFormData>(emptyServerForm);
  const [confirmDeleteServer, setConfirmDeleteServer] = useState<string | null>(null);

  const servers = (serversStats as any[]) ?? [];

  // Build a map: instanceId -> { vpsId, vpsName, container }
  const instanceVpsMap = useMemo(() => {
    const map: Record<string, { vpsId: string; vpsName: string; container: any }> = {};

    for (const vps of servers) {
      if (!vps.containers) continue;
      for (const container of vps.containers) {
        for (const inst of instances ?? []) {
          if (container.name.includes(inst.id)) {
            map[inst.id] = { vpsId: vps.id, vpsName: vps.name, container };
          }
        }
      }
    }

    for (const inst of instances ?? []) {
      if ((inst as any).vpsId) {
        const vps = servers.find((s: any) => s.id === (inst as any).vpsId);
        const existing = map[inst.id];
        map[inst.id] = {
          vpsId: (inst as any).vpsId,
          vpsName: vps?.name ?? (inst as any).vpsId,
          container: existing?.container ?? null,
        };
      }
    }

    return map;
  }, [servers, instances]);

  const total = instances?.length ?? 0;
  const running =
    instances?.filter(
      (i: any) => getContainerStatus(i) === "running",
    ).length ?? 0;
  const stopped =
    instances?.filter((i: any) =>
      isStoppedStatus(getContainerStatus(i)),
    ).length ?? 0;
  const unknown =
    instances?.filter(
      (i: any) =>
        !["running", "stopped", "exited", "dead"].includes(
          getContainerStatus(i),
        ),
    ).length ?? 0;

  const filtered = useMemo(() => {
    let list = instances ?? [];

    if (filter === "running") {
      list = list.filter(
        (i: any) => getContainerStatus(i) === "running",
      );
    } else if (filter === "stopped") {
      list = list.filter((i: any) =>
        isStoppedStatus(getContainerStatus(i)),
      );
    } else if (filter === "unknown") {
      list = list.filter(
        (i: any) =>
          !["running", "stopped", "exited", "dead"].includes(
            getContainerStatus(i),
          ),
      );
    }

    if (vpsFilter !== "all") {
      list = list.filter(
        (i: any) => (instanceVpsMap[i.id]?.vpsId ?? "vps-main") === vpsFilter,
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i: any) =>
          i.userName?.toLowerCase().includes(q) ||
          i.userEmail?.toLowerCase().includes(q) ||
          i.model?.toLowerCase().includes(q) ||
          i.id?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [instances, filter, vpsFilter, search, instanceVpsMap]);

  const handleAction = (id: string, action: ManageInstanceAction) => {
    manageInstance.mutate({ id, action });
    if (action === ManageInstanceAction.DESTROY) {
      setConfirmDestroy(null);
    }
  };

  // Server CRUD handlers
  const openCreateDialog = () => {
    setServerForm(emptyServerForm);
    setServerDialogMode("create");
    setServerDialogOpen(true);
  };

  const openEditDialog = (server: any) => {
    setServerForm({
      id: server.id,
      name: server.name,
      location: server.location,
      endpoint: server.endpoint ?? "local",
      token: server.token ?? "",
    });
    setServerDialogMode("edit");
    setServerDialogOpen(true);
  };

  const handleServerSubmit = () => {
    if (serverDialogMode === "create") {
      createServer.mutate(
        {
          id: serverForm.id,
          name: serverForm.name,
          location: serverForm.location,
          endpoint: serverForm.endpoint || "local",
          token: serverForm.token || undefined,
        },
        { onSuccess: () => setServerDialogOpen(false) },
      );
    } else {
      updateServer.mutate(
        {
          id: serverForm.id,
          name: serverForm.name,
          location: serverForm.location,
          endpoint: serverForm.endpoint || "local",
          token: serverForm.token || undefined,
        },
        { onSuccess: () => setServerDialogOpen(false) },
      );
    }
  };

  const handleDeleteServer = (serverId: string) => {
    deleteServer.mutate(serverId, {
      onSuccess: () => setConfirmDeleteServer(null),
    });
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Carregando instâncias...
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">Instâncias</h1>

      {/* VPS Server Cards */}
      <>
        <div className="flex items-center gap-2">
          <Icons.Server className="text-muted-foreground size-5" />
          <h2 className="text-lg font-semibold">Servidores</h2>
          <span className="text-muted-foreground text-xs">
            (atualiza a cada 30s)
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
            onClick={openCreateDialog}
          >
            <Icons.Plus className="mr-1 size-4" />
            Adicionar VPS
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {servers.length === 0 && (
            <div className="text-muted-foreground py-4 text-center text-sm">
              Nenhum servidor encontrado. Adicione uma VPS.
            </div>
          )}
          {servers.map((vps: any) => {
            const srv = vps.server;
            const serverRecord = (serversData as any[])?.find(
              (s: any) => s.id === vps.id,
            );

            if (!vps.online || !srv) {
              return (
                <Card key={vps.id} className="border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="size-2.5 rounded-full bg-red-500" />
                    <div>
                      <span className="font-semibold">{vps.name}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({vps.location})
                      </span>
                    </div>
                    <Badge variant="destructive">Offline</Badge>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(serverRecord ?? vps)}
                      >
                        <Icons.Pencil className="size-4" />
                      </Button>
                      {vps.id !== "vps-main" && (
                        confirmDeleteServer === vps.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={deleteServer.isPending}
                              onClick={() => handleDeleteServer(vps.id)}
                            >
                              Confirmar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmDeleteServer(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDeleteServer(vps.id)}
                          >
                            <Icons.Trash className="size-4" />
                          </Button>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={vps.id}>
                <CardContent className="py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="size-2.5 rounded-full bg-green-500" />
                    <span className="font-semibold">{vps.name}</span>
                    <span className="text-muted-foreground text-sm">
                      ({vps.location})
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      Up {formatUptime(srv.uptimeSeconds)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(serverRecord ?? vps)}
                    >
                      <Icons.Pencil className="size-4" />
                    </Button>
                    {vps.id !== "vps-main" && (
                      confirmDeleteServer === vps.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteServer.isPending}
                            onClick={() => handleDeleteServer(vps.id)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteServer(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteServer(vps.id)}
                        >
                          <Icons.Trash className="size-4" />
                        </Button>
                      )
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Icons.Cpu className="size-3.5" /> CPU
                        </span>
                        <span className="font-medium">{srv.cpuPercent}%</span>
                      </div>
                      <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(srv.cpuPercent)}`}
                          style={{ width: `${Math.min(srv.cpuPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">{srv.cpuCores} cores</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Icons.MemoryStick className="size-3.5" /> RAM
                        </span>
                        <span className="font-medium">{srv.memPercent}%</span>
                      </div>
                      <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(srv.memPercent)}`}
                          style={{ width: `${Math.min(srv.memPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatBytes(srv.memUsed)} / {formatBytes(srv.memTotal)}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Icons.HardDrive className="size-3.5" /> Disco
                        </span>
                        <span className="font-medium">{srv.diskPercent}%</span>
                      </div>
                      <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor(srv.diskPercent)}`}
                          style={{ width: `${Math.min(srv.diskPercent, 100)}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {formatBytes(srv.diskUsed)} / {formatBytes(srv.diskTotal)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Servers from DB not yet in stats */}
          {(serversData as any[])
            ?.filter((s: any) => !servers.some((sv: any) => sv.id === s.id))
            .map((s: any) => (
              <Card key={s.id} className="border-dashed">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="bg-muted-foreground size-2.5 rounded-full" />
                  <div>
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      ({s.location})
                    </span>
                  </div>
                  <Badge variant="secondary">Aguardando stats...</Badge>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(s)}
                    >
                      <Icons.Pencil className="size-4" />
                    </Button>
                    {s.id !== "vps-main" && (
                      confirmDeleteServer === s.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deleteServer.isPending}
                            onClick={() => handleDeleteServer(s.id)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDeleteServer(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDeleteServer(s.id)}
                        >
                          <Icons.Trash className="size-4" />
                        </Button>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </>

      {/* Server Add/Edit Dialog */}
      <Dialog open={serverDialogOpen} onOpenChange={setServerDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {serverDialogMode === "create" ? "Adicionar VPS" : "Editar VPS"}
            </DialogTitle>
            <DialogDescription>
              {serverDialogMode === "create"
                ? "Preencha os dados do novo servidor VPS."
                : "Edite os dados do servidor VPS."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="server-id">ID</Label>
              <Input
                id="server-id"
                placeholder="vps-us (slug único)"
                value={serverForm.id}
                disabled={serverDialogMode === "edit"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setServerForm((f) => ({ ...f, id: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="server-name">Nome</Label>
              <Input
                id="server-name"
                placeholder="VPS EUA"
                value={serverForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setServerForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="server-location">Localização</Label>
              <Input
                id="server-location"
                placeholder="Virginia, EUA"
                value={serverForm.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setServerForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="server-endpoint">Endpoint</Label>
              <Input
                id="server-endpoint"
                placeholder="local ou https://vps.example.com:9100"
                value={serverForm.endpoint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setServerForm((f) => ({ ...f, endpoint: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="server-token">Token (opcional)</Label>
              <Input
                id="server-token"
                type="password"
                placeholder="Bearer token para agent remoto"
                value={serverForm.token}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setServerForm((f) => ({ ...f, token: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setServerDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleServerSubmit}
              disabled={
                !serverForm.id ||
                !serverForm.name ||
                !serverForm.location ||
                createServer.isPending ||
                updateServer.isPending
              }
            >
              {serverDialogMode === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filter tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
              {f !== "all" && (
                <span className="text-muted-foreground ml-1 text-xs">
                  ({f === "running" ? running : f === "stopped" ? stopped : unknown})
                </span>
              )}
            </Button>
          ))}

          {servers.length > 1 && (
            <select
              className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-sm"
              value={vpsFilter}
              onChange={(e) => setVpsFilter(e.target.value)}
            >
              <option value="all">VPS: Todas</option>
              {servers.map((vps: any) => (
                <option key={vps.id} value={vps.id}>
                  {vps.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="relative w-full sm:w-64">
          <Icons.Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
          <Input
            placeholder="Buscar por usuário, modelo..."
            className="pl-8"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${filter === "all" ? "border-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Total</span>
            <Icons.MonitorSmartphone className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "running" ? "border-primary" : ""}`}
          onClick={() => setFilter("running")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Rodando</span>
            <div className="size-2.5 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{running}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "stopped" ? "border-primary" : ""}`}
          onClick={() => setFilter("stopped")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Paradas</span>
            <div className="size-2.5 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stopped}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "unknown" ? "border-primary" : ""}`}
          onClick={() => setFilter("unknown")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Desconhecido</span>
            <div className="bg-muted-foreground size-2.5 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unknown}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {!filtered.length ? (
        <div className="text-muted-foreground py-8 text-center">
          Nenhuma instância encontrada
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Servidor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>CPU</TableHead>
              <TableHead>RAM</TableHead>
              <TableHead>Rede</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inst: any) => {
              const containerStatus = getContainerStatus(inst);
              const isRunning = containerStatus === "running";
              const match = instanceVpsMap[inst.id];
              const container = match?.container ?? null;
              const vpsName = match?.vpsName ?? "—";

              return (
                <TableRow key={inst.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium leading-none">{inst.userName}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{inst.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{inst.model}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{channelLabel(inst.communicationChannel)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{vpsName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-2 rounded-full ${
                          isRunning
                            ? "bg-green-500"
                            : isStoppedStatus(containerStatus)
                              ? "bg-red-500"
                              : "bg-muted-foreground"
                        }`}
                      />
                      <Badge variant={statusVariant(containerStatus)}>
                        {statusLabel(containerStatus)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {container ? (
                      <span className="text-sm font-medium">{container.cpu}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {container ? (
                      <div>
                        <span className="text-sm font-medium">{container.memPercent}</span>
                        <p className="text-muted-foreground text-xs">{container.mem}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {container ? (
                      <span className="text-muted-foreground text-xs">{container.net}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">{relativeDate(inst.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {isRunning ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={manageInstance.isPending}
                          onClick={() => handleAction(inst.id, ManageInstanceAction.STOP)}
                        >
                          Parar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={manageInstance.isPending}
                          onClick={() => handleAction(inst.id, ManageInstanceAction.START)}
                        >
                          Iniciar
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={manageInstance.isPending}
                        onClick={() => handleAction(inst.id, ManageInstanceAction.RESTART)}
                      >
                        Reiniciar
                      </Button>
                      {confirmDestroy === inst.id ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={manageInstance.isPending}
                            onClick={() => handleAction(inst.id, ManageInstanceAction.DESTROY)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDestroy(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={manageInstance.isPending}
                          onClick={() => setConfirmDestroy(inst.id)}
                        >
                          Destruir
                        </Button>
                      )}
                    </div>
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
