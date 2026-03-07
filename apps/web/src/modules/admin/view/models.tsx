"use client";

import { useState } from "react";

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
  useAdminModels,
  useAdminCreateModel,
  useAdminUpdateModel,
  useAdminDeleteModel,
  useAdminReorderModels,
} from "../hooks/use-admin";

type StatusFilter = "all" | "active" | "inactive";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  active: "Ativos",
  inactive: "Inativos",
};

const PROVIDERS = ["openai", "anthropic", "google"] as const;
const TIERS = ["flagship", "balanced", "fast", "reasoning"] as const;

const providerLabel = (p: string) => {
  switch (p) {
    case "openai": return "OpenAI";
    case "anthropic": return "Anthropic";
    case "google": return "Google";
    default: return p;
  }
};

const tierLabel = (t: string) => {
  switch (t) {
    case "flagship": return "Flagship";
    case "balanced": return "Balanced";
    case "fast": return "Fast";
    case "reasoning": return "Reasoning";
    default: return t;
  }
};

const tierVariant = (t: string) => {
  switch (t) {
    case "flagship": return "default" as const;
    case "balanced": return "secondary" as const;
    case "fast": return "outline" as const;
    case "reasoning": return "warning" as const;
    default: return "secondary" as const;
  }
};

interface ModelFormData {
  id: string;
  provider: string;
  name: string;
  tier: string;
  isActive: boolean;
}

const emptyForm: ModelFormData = {
  id: "",
  provider: "openai",
  name: "",
  tier: "flagship",
  isActive: true,
};

export function AdminModels() {
  const { data: models, isLoading } = useAdminModels();
  const createModel = useAdminCreateModel();
  const updateModel = useAdminUpdateModel();
  const deleteModel = useAdminDeleteModel();
  const reorderModels = useAdminReorderModels();

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState<ModelFormData>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const allModels = (models as any[]) ?? [];
  const active = allModels.filter((m: any) => m.isActive).length;
  const inactive = allModels.length - active;

  const filtered = allModels.filter((m: any) => {
    if (filter === "active") return m.isActive;
    if (filter === "inactive") return !m.isActive;
    return true;
  });

  const openCreateDialog = () => {
    setForm(emptyForm);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEditDialog = (model: any) => {
    setForm({
      id: model.id,
      provider: model.provider,
      name: model.name,
      tier: model.tier,
      isActive: model.isActive,
    });
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (dialogMode === "create") {
      createModel.mutate(
        {
          id: form.id,
          provider: form.provider,
          name: form.name,
          tier: form.tier,
          isActive: form.isActive,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    } else {
      updateModel.mutate(
        {
          id: form.id,
          provider: form.provider,
          name: form.name,
          tier: form.tier,
          isActive: form.isActive,
        },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

  const handleDelete = (id: string) => {
    deleteModel.mutate(id, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  const handleToggleActive = (model: any) => {
    updateModel.mutate({
      id: model.id,
      isActive: !model.isActive,
    });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...allModels];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index]!, newOrder[index - 1]!];
    reorderModels.mutate(
      newOrder.map((m: any, i: number) => ({ id: m.id, sortOrder: i })),
    );
  };

  const handleMoveDown = (index: number) => {
    if (index >= allModels.length - 1) return;
    const newOrder = [...allModels];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1]!, newOrder[index]!];
    reorderModels.mutate(
      newOrder.map((m: any, i: number) => ({ id: m.id, sortOrder: i })),
    );
  };

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Carregando modelos...
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Modelos AI</h1>
        <Button onClick={openCreateDialog}>
          <Icons.Plus className="mr-1 size-4" />
          Adicionar Modelo
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          className={`cursor-pointer transition-colors ${filter === "all" ? "border-primary" : ""}`}
          onClick={() => setFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Total</span>
            <Icons.Bot className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allModels.length}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "active" ? "border-primary" : ""}`}
          onClick={() => setFilter("active")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Ativos</span>
            <div className="size-2.5 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active}</div>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-colors ${filter === "inactive" ? "border-primary" : ""}`}
          onClick={() => setFilter("inactive")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <span className="text-muted-foreground text-sm font-medium">Inativos</span>
            <div className="size-2.5 rounded-full bg-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inactive}</div>
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
          </Button>
        ))}
      </div>

      {/* Table */}
      {!filtered.length ? (
        <div className="text-muted-foreground py-8 text-center">
          Nenhum modelo encontrado
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((model: any, index: number) => (
              <TableRow key={model.id} className={!model.isActive ? "opacity-50" : ""}>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      disabled={index === 0 || reorderModels.isPending}
                      onClick={() => handleMoveUp(allModels.indexOf(model))}
                    >
                      <Icons.ChevronUp className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      disabled={index === filtered.length - 1 || reorderModels.isPending}
                      onClick={() => handleMoveDown(allModels.indexOf(model))}
                    >
                      <Icons.ChevronDown className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-xs">{model.id}</code>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{model.name}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{providerLabel(model.provider)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={tierVariant(model.tier)}>{tierLabel(model.tier)}</Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={updateModel.isPending}
                    onClick={() => handleToggleActive(model)}
                  >
                    <div
                      className={`mr-1.5 size-2 rounded-full ${
                        model.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    {model.isActive ? "Ativo" : "Inativo"}
                  </Button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(model)}
                    >
                      <Icons.Pencil className="size-4" />
                    </Button>
                    {confirmDelete === model.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteModel.isPending}
                          onClick={() => handleDelete(model.id)}
                        >
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDelete(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(model.id)}
                      >
                        <Icons.Trash className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Adicionar Modelo" : "Editar Modelo"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Adicione um novo modelo AI ao catálogo."
                : "Edite as informações do modelo."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model-id">ID</Label>
              <Input
                id="model-id"
                placeholder="gpt-5.4 (slug único)"
                value={form.id}
                disabled={dialogMode === "edit"}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, id: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-name">Nome</Label>
              <Input
                id="model-name"
                placeholder="GPT 5.4"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-provider">Provider</Label>
              <select
                id="model-provider"
                className="border-input bg-background text-foreground h-10 rounded-md border px-3 text-sm"
                value={form.provider}
                onChange={(e) =>
                  setForm((f) => ({ ...f, provider: e.target.value }))
                }
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {providerLabel(p)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="model-tier">Tier</Label>
              <select
                id="model-tier"
                className="border-input bg-background text-foreground h-10 rounded-md border px-3 text-sm"
                value={form.tier}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tier: e.target.value }))
                }
              >
                {TIERS.map((t) => (
                  <option key={t} value={t}>
                    {tierLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !form.id ||
                !form.name ||
                !form.provider ||
                createModel.isPending ||
                updateModel.isPending
              }
            >
              {dialogMode === "create" ? "Criar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
