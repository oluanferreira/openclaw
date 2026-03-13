import { Hono } from "hono";
import crypto from "node:crypto";

import { and, eq, lt } from "@workspace/db";
import {
  bridgeAuditLog,
  bridgeConnection,
  bridgeMobileRequest,
  instance,
} from "@workspace/db/schema";
import { db } from "@workspace/db/server";
import {
  notifyAgent,
  restartContainer,
  updateOpenclawJson,
  updateToolsMd,
} from "@workspace/openclaw/server";

import { enforceAuth, enforceInstance, rateLimit } from "../../middleware";

import type {
  BridgeCapabilities,
  BridgeFileConfig,
  BridgeNotificationConfig,
  BridgeTerminalConfig,
} from "@workspace/db/schema";

const HEARTBEAT_TIMEOUT_MS = 90_000;

// --- Bridge Tools Section Generator ---

function generateBridgeToolsSection(
  capabilities: BridgeCapabilities,
): string | null {
  const sections: string[] = [];

  if (capabilities.browser) {
    sections.push(`## Bridge — Browser Control

O ClaWin Bridge esta conectado e voce tem acesso a browser tools no PC do usuario.
As acoes sao executadas via Chrome Extension no navegador real do usuario.

### Tools Disponiveis

| Tool | Descricao | Parametros |
|------|-----------|-----------|
| \`browser.navigate\` | Navega para uma URL | \`url: string\` |
| \`browser.click\` | Clica em um elemento | \`selector: string\` |
| \`browser.type\` | Digita texto em um campo | \`selector: string, text: string\` |
| \`browser.read_page\` | Le o conteudo da pagina atual | — |
| \`browser.screenshot\` | Tira screenshot da pagina | \`selector?: string\` (opcional, area especifica) |

### Como usar

Essas tools sao executadas no PC do usuario via Bridge + Chrome Extension.
Use linguagem natural para descrever a acao desejada — o Node Host traduz para comandos do browser.

### Exemplos

- "Abra google.com e pesquise por X" → browser.navigate + browser.type + browser.click
- "Leia o conteudo da pagina atual" → browser.read_page
- "Tire um screenshot da pagina" → browser.screenshot

### Limitacoes

- Funciona apenas enquanto o Bridge estiver conectado
- Acoes que exigem aprovacao do usuario podem demorar
- Nao use browser.evaluate a menos que o usuario habilite explicitamente`);
  }

  if (capabilities.terminal) {
    sections.push(`## Bridge — Terminal Remoto

O Bridge permite executar comandos no terminal do PC do usuario.

| Tool | Descricao | Parametros |
|------|-----------|-----------|
| \`system.run\` | Executa comando no terminal | \`command: string\` |

**Nota:** Comandos requerem aprovacao do usuario no Bridge.`);
  }

  if (capabilities.files) {
    sections.push(`## Bridge — Acesso a Arquivos

O Bridge permite ler e escrever arquivos no PC do usuario dentro de diretorios permitidos.

### Tools Disponiveis

| Tool | Descricao | Parametros |
|------|-----------|-----------|
| \`files.read\` | Le conteudo de um arquivo | \`path: string\` |
| \`files.write\` | Escreve conteudo em um arquivo | \`path: string, content: string\` |
| \`files.list\` | Lista arquivos em um diretorio | \`path: string, recursive?: boolean\` |
| \`files.search\` | Busca texto em arquivos | \`path: string, pattern: string, glob?: string\` |

### Regras de Acesso

- Apenas diretorios na allowlist do usuario podem ser acessados
- Arquivos sensiveis (\`.env*\`, \`*.pem\`, \`*.key\`, \`.ssh/\`, \`credentials*\`) sao SEMPRE bloqueados
- Operacoes de escrita requerem permissao "read-write" no diretorio
- Operacoes de leitura funcionam com permissao "read" ou "read-write"

### Limitacoes

- Funciona apenas enquanto o Bridge estiver conectado
- Arquivos > 10MB nao sao suportados
- Padroes sensiveis sao bloqueados independente da allowlist`);
  }

  if (capabilities.notifications) {
    sections.push(`## Bridge — Notificações Desktop

O Bridge permite enviar notificações nativas para o desktop do usuário.

| Tool | Descricao | Parametros |
|------|-----------|-----------|
| \`notifications.send\` | Envia notificacao desktop | \`title: string, body: string, type?: "info" | "alert" | "action"\` |

### Tipos de Notificacao

- **info** — Informativo (tarefa concluida, update de status)
- **alert** — Alerta (erro, atencao necessaria)
- **action** — Acao concluida (deploy, build, test)

### Regras

- O usuario pode desabilitar tipos especificos no dashboard
- Notificacoes durante "horario silencioso" sao enfileiradas e entregues depois
- Use com moderacao — notificacoes excessivas podem ser desabilitadas pelo usuario`);
  }

  if (sections.length === 0) return null;
  return sections.join("\n\n");
}

// --- Mobile Tools Section Generator ---

const MOBILE_TOOLS = [
  "camera.capture",
  "contacts.search",
  "location.get",
  "calendar.events",
];

function generateMobileToolsSection(): string {
  return `## Mobile Companion

O usuario tem o ClaWin Companion conectado no celular. Voce pode solicitar acoes no telefone dele.

**IMPORTANTE:** Requests mobile requerem aprovacao do usuario. Ele vera um prompt no celular.
Resultados podem levar 10-60 segundos pois o usuario precisa interagir fisicamente com o dispositivo.

### Como usar

1. Crie um request: POST https://clawin1click.com/api/bridge/mobile/request
   Headers: Authorization: Bearer {gateway_token}
   Body: {"tool": "<tool_name>", "args": {<args>}}
   Response: {"requestId": "..."}

2. Poll o resultado: GET https://clawin1click.com/api/bridge/mobile/result/{requestId}
   Headers: Authorization: Bearer {gateway_token}
   Response quando pendente: {"status": "pending"} ou {"status": "claimed"}
   Response quando pronto: {"status": "completed", "result": {...}}
   Response quando expirado: {"status": "expired"} (HTTP 410)
   Response quando erro: {"status": "error", "error": "..."}

### Tools Disponiveis

| Tool | Descricao | Args |
|------|-----------|------|
| \`camera.capture\` | Tira uma foto com a camera do celular | \`description?: string\` (o que fotografar) |
| \`contacts.search\` | Busca contatos por nome ou email | \`query: string\` (nome ou email) |
| \`location.get\` | Obtem localizacao GPS atual (~100m) | — |
| \`calendar.events\` | Lista eventos do calendario | \`days?: number\` (padrao: 7) |

### Limites

- Requests expiram em 3 minutos se nao forem atendidos
- Fotos: max 2MP, JPEG
- Contatos: max 10 resultados por busca (nome, telefone, email)
- Calendario: max 20 eventos
- Localizacao: precisao ~100m`;
}

// --- Helpers ---

async function getOrCreateBridge(
  instanceId: string,
  deviceType: "desktop" | "mobile" = "desktop",
) {
  const existing = await db.query.bridgeConnection.findFirst({
    where: and(
      eq(bridgeConnection.instanceId, instanceId),
      eq(bridgeConnection.deviceType, deviceType),
    ),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(bridgeConnection)
    .values({ instanceId, deviceType })
    .returning();

  return created!;
}

function isConnected(lastSeen: Date | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - lastSeen.getTime() < HEARTBEAT_TIMEOUT_MS;
}

// Best-effort TOOLS.md sync (fire-and-forget, never blocks response)
function syncToolsMd(
  instanceId: string,
  capabilities: BridgeCapabilities,
  connected: boolean,
  hasMobile?: boolean,
): void {
  const desktopSection = connected
    ? generateBridgeToolsSection(capabilities)
    : null;
  const mobileSection = hasMobile ? generateMobileToolsSection() : null;

  const parts = [desktopSection, mobileSection].filter(Boolean);
  const section = parts.length > 0 ? parts.join("\n\n") : null;

  updateToolsMd(instanceId, section).catch(() => {
    /* noop */
  });
}

// Best-effort agent notification
function notifyBridgeState(instanceId: string, connected: boolean): void {
  const message = connected
    ? "ClaWin Bridge connected. Browser tools are now available. Check TOOLS.md for details."
    : "ClaWin Bridge disconnected. Browser tools are no longer available.";

  notifyAgent(instanceId, message).catch(() => {
    /* noop */
  });
}

// --- Audit Logging (fire-and-forget) ---

function audit(
  instanceId: string,
  action: string,
  result: string,
  params?: Record<string, unknown>,
  durationMs?: number,
  ipAddress?: string,
): void {
  db.insert(bridgeAuditLog)
    .values({
      instanceId,
      action,
      result,
      params: params ?? null,
      durationMs: durationMs ?? null,
      ipAddress: ipAddress ?? null,
    })
    .catch(() => {
      /* noop */
    });
}

function getClientIp(c: {
  req: { header: (name: string) => string | undefined };
}): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

// --- Router ---

export const bridgeRouter = new Hono()

  // GET /api/bridge/status
  .get("/status", enforceAuth, enforceInstance, async (c) => {
    const start = Date.now();
    const instanceId = c.var.instanceId;
    const bridge = await getOrCreateBridge(instanceId);

    // Get gateway token from instance
    const inst = await db.query.instance.findFirst({
      where: eq(instance.id, instanceId),
      columns: { token: true },
    });

    const connected = isConnected(bridge.lastSeen);

    // Disconnect detection: if bridge was recently connected but now timed out, clean up TOOLS.md
    if (!connected && bridge.lastSeen) {
      const timeSinceLastSeen = Date.now() - bridge.lastSeen.getTime();
      if (timeSinceLastSeen < HEARTBEAT_TIMEOUT_MS * 3) {
        syncToolsMd(instanceId, bridge.capabilities, false);
        notifyBridgeState(instanceId, false);
        audit(
          instanceId,
          "disconnect",
          "success",
          {
            reason: "heartbeat_timeout",
            lastSeen: bridge.lastSeen.toISOString(),
          },
          Date.now() - start,
          getClientIp(c),
        );
      }
    }

    return c.json({
      connected,
      lastSeen: bridge.lastSeen?.toISOString() ?? null,
      deviceName: bridge.deviceName,
      appVersion: bridge.appVersion,
      capabilities: bridge.capabilities,
      token: inst?.token ?? "",
    });
  })

  .get("/mobile-status", enforceAuth, enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const mobileBridge = await db.query.bridgeConnection.findFirst({
      where: and(
        eq(bridgeConnection.instanceId, instanceId),
        eq(bridgeConnection.deviceType, "mobile"),
      ),
    });

    const connected = mobileBridge ? isConnected(mobileBridge.lastSeen) : false;

    return c.json({
      connected,
      lastSeen: mobileBridge?.lastSeen?.toISOString() ?? null,
      deviceName: mobileBridge?.deviceName ?? null,
    });
  })

  // POST /api/bridge/token/rotate
  .post("/token/rotate", enforceAuth, enforceInstance, async (c) => {
    const start = Date.now();
    const instanceId = c.var.instanceId;
    const ip = getClientIp(c);

    const newToken = crypto.randomBytes(32).toString("base64");

    await db
      .update(instance)
      .set({ token: newToken })
      .where(eq(instance.id, instanceId));

    await updateOpenclawJson(instanceId, {
      gateway: { auth: { token: newToken } },
    });

    await restartContainer(instanceId);

    await db
      .update(bridgeConnection)
      .set({ lastSeen: null, deviceName: null, updatedAt: new Date() })
      .where(eq(bridgeConnection.instanceId, instanceId));

    syncToolsMd(
      instanceId,
      {
        browser: true,
        terminal: true,
        files: false,
        clipboard: false,
        notifications: true,
      },
      false,
    );

    audit(instanceId, "token_rotate", "success", {}, Date.now() - start, ip);

    return c.json({ token: newToken });
  })

  // PUT /api/bridge/capabilities
  .put("/capabilities", enforceAuth, enforceInstance, async (c) => {
    const start = Date.now();
    const instanceId = c.var.instanceId;
    const ip = getClientIp(c);
    const body = await c.req.json<Partial<BridgeCapabilities>>();

    const bridge = await getOrCreateBridge(instanceId);

    const updated: BridgeCapabilities = {
      ...bridge.capabilities,
      ...body,
    };

    await db
      .update(bridgeConnection)
      .set({ capabilities: updated, updatedAt: new Date() })
      .where(eq(bridgeConnection.instanceId, instanceId));

    const connected = isConnected(bridge.lastSeen);
    if (connected) {
      syncToolsMd(instanceId, updated, true);
      notifyAgent(
        instanceId,
        "Bridge capabilities updated. Check TOOLS.md for current available tools.",
      ).catch(() => {
        /* noop */
      });
    }

    audit(
      instanceId,
      "capability_change",
      "success",
      {
        before: bridge.capabilities,
        after: updated,
        bridgeConnected: connected,
      },
      Date.now() - start,
      ip,
    );

    return c.json({ capabilities: updated });
  })

  // GET /api/bridge/terminal — return terminal config
  .get("/terminal", enforceAuth, enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const bridge = await getOrCreateBridge(instanceId);
    return c.json(bridge.terminalConfig);
  })

  // PUT /api/bridge/terminal — update terminal config
  .put("/terminal", enforceAuth, enforceInstance, async (c) => {
    const start = Date.now();
    const instanceId = c.var.instanceId;
    const ip = getClientIp(c);
    const body = await c.req.json<Partial<BridgeTerminalConfig>>();

    const bridge = await getOrCreateBridge(instanceId);

    const updated: BridgeTerminalConfig = {
      ...bridge.terminalConfig,
      ...body,
    };

    // Validate allowlist entries (glob patterns, no shell injection)
    if (updated.allowlist.some((p: string) => /[;&|`$]/.test(p))) {
      return c.json({ error: "Invalid characters in allowlist pattern" }, 400);
    }

    if (updated.timeoutSeconds < 1 || updated.timeoutSeconds > 300) {
      return c.json({ error: "timeoutSeconds must be between 1 and 300" }, 400);
    }

    await db
      .update(bridgeConnection)
      .set({ terminalConfig: updated, updatedAt: new Date() })
      .where(eq(bridgeConnection.instanceId, instanceId));

    // Sync timeout to container exec config (fire-and-forget)
    updateOpenclawJson(instanceId, {
      tools: { exec: { timeoutSeconds: updated.timeoutSeconds } },
    }).catch(() => {
      /* noop */
    });

    audit(
      instanceId,
      "terminal_config_change",
      "success",
      {
        before: bridge.terminalConfig,
        after: updated,
      },
      Date.now() - start,
      ip,
    );

    return c.json(updated);
  })

  // GET /api/bridge/files — return file config
  .get("/files", enforceAuth, enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const bridge = await getOrCreateBridge(instanceId);
    return c.json(bridge.fileConfig);
  })

  // PUT /api/bridge/files — update file config
  .put("/files", enforceAuth, enforceInstance, async (c) => {
    const start = Date.now();
    const instanceId = c.var.instanceId;
    const ip = getClientIp(c);
    const body = await c.req.json<Partial<BridgeFileConfig>>();

    const bridge = await getOrCreateBridge(instanceId);

    const updated: BridgeFileConfig = {
      ...bridge.fileConfig,
      ...body,
    };

    // Validate allowed dirs
    if (updated.allowedDirs.some((d) => /[;&|`$]/.test(d.path))) {
      return c.json({ error: "Invalid characters in directory path" }, 400);
    }

    if (updated.allowedDirs.some((d) => d.path.includes(".."))) {
      return c.json({ error: "Path traversal not allowed" }, 400);
    }

    if (
      updated.allowedDirs.some(
        (d) => !["read", "read-write"].includes(d.permission),
      )
    ) {
      return c.json(
        { error: "Permission must be 'read' or 'read-write'" },
        400,
      );
    }

    // Ensure core blocked patterns are never removed
    const coreBlocked = [
      ".env*",
      "*.pem",
      "*.key",
      ".ssh/",
      "credentials*",
      "*.p12",
      "*.pfx",
    ];
    for (const p of coreBlocked) {
      if (!updated.blockedPatterns.includes(p)) {
        updated.blockedPatterns.push(p);
      }
    }

    await db
      .update(bridgeConnection)
      .set({ fileConfig: updated, updatedAt: new Date() })
      .where(eq(bridgeConnection.instanceId, instanceId));

    audit(
      instanceId,
      "file_config_change",
      "success",
      {
        before: bridge.fileConfig,
        after: updated,
      },
      Date.now() - start,
      ip,
    );

    return c.json(updated);
  })

  // POST /api/bridge/files/audit (token auth, rate limited)
  .post("/files/audit", rateLimit(30, 60_000), async (c) => {
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const body = await c.req.json<{
      path: string;
      operation: "read" | "write" | "list" | "search";
      result: "approved" | "denied" | "blocked_pattern" | "blocked_dir";
      durationMs?: number;
    }>();

    audit(
      inst.id,
      "file_access",
      body.result,
      {
        path: body.path,
        operation: body.operation,
      },
      body.durationMs,
      ip,
    );

    return c.json({ ok: true });
  })

  // GET /api/bridge/notifications -- return notification config
  .get("/notifications", enforceAuth, enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const bridge = await getOrCreateBridge(instanceId);
    return c.json(bridge.notificationConfig);
  })

  // PUT /api/bridge/notifications -- update notification config
  .put("/notifications", enforceAuth, enforceInstance, async (c) => {
    const start = Date.now();
    const instanceId = c.var.instanceId;
    const ip = getClientIp(c);
    const body = await c.req.json<Partial<BridgeNotificationConfig>>();

    const bridge = await getOrCreateBridge(instanceId);

    const updated: BridgeNotificationConfig = {
      ...bridge.notificationConfig,
      ...body,
    };

    // Validate allowed types
    const validTypes = ["info", "alert", "action"];
    if (updated.allowedTypes.some((t) => !validTypes.includes(t))) {
      return c.json({ error: "Invalid notification type" }, 400);
    }

    // Validate quiet hours (0-23 or null)
    if (
      updated.quietHoursStart !== null &&
      (updated.quietHoursStart < 0 || updated.quietHoursStart > 23)
    ) {
      return c.json({ error: "quietHoursStart must be 0-23 or null" }, 400);
    }
    if (
      updated.quietHoursEnd !== null &&
      (updated.quietHoursEnd < 0 || updated.quietHoursEnd > 23)
    ) {
      return c.json({ error: "quietHoursEnd must be 0-23 or null" }, 400);
    }

    await db
      .update(bridgeConnection)
      .set({ notificationConfig: updated, updatedAt: new Date() })
      .where(eq(bridgeConnection.instanceId, instanceId));

    audit(
      instanceId,
      "notification_config_change",
      "success",
      {
        before: bridge.notificationConfig,
        after: updated,
      },
      Date.now() - start,
      ip,
    );

    return c.json(updated);
  })

  // POST /api/bridge/notifications/audit (token auth, rate limited)
  .post("/notifications/audit", rateLimit(30, 60_000), async (c) => {
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const body = await c.req.json<{
      title: string;
      body: string;
      type: "info" | "alert" | "action";
      result: "delivered" | "queued" | "blocked" | "quiet_hours";
    }>();

    audit(
      inst.id,
      "notification_send",
      body.result,
      {
        title: body.title,
        body: body.body,
        type: body.type,
      },
      undefined,
      ip,
    );

    return c.json({ ok: true });
  })

  // POST /api/bridge/terminal/audit (token auth, rate limited)
  .post("/terminal/audit", rateLimit(30, 60_000), async (c) => {
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const body = await c.req.json<{
      command: string;
      result: "approved" | "denied" | "auto_approved";
      durationMs?: number;
    }>();

    audit(
      inst.id,
      "terminal_exec",
      body.result,
      {
        command: body.command,
      },
      body.durationMs,
      ip,
    );

    return c.json({ ok: true });
  })

  // POST /api/bridge/heartbeat (token auth, rate limited)
  .post("/heartbeat", rateLimit(10, 60_000), async (c) => {
    const start = Date.now();
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      audit(
        "unknown",
        "heartbeat",
        "blocked",
        {
          reason: "missing_token",
        },
        Date.now() - start,
        ip,
      );
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);

    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      audit(
        "unknown",
        "heartbeat",
        "blocked",
        {
          reason: "invalid_token",
          tokenPrefix: token.slice(0, 8),
        },
        Date.now() - start,
        ip,
      );
      return c.json({ error: "Invalid token" }, 401);
    }

    const body = await c.req
      .json<{
        deviceName?: string;
        appVersion?: string;
        deviceType?: "desktop" | "mobile";
      }>()
      .catch(
        (): {
          deviceName?: string;
          appVersion?: string;
          deviceType?: "desktop" | "mobile";
        } => ({}),
      );

    const deviceType = body.deviceType === "mobile" ? "mobile" : "desktop";

    const bridge = await getOrCreateBridge(inst.id, deviceType);
    const wasDisconnected = !isConnected(bridge.lastSeen);

    const now = new Date();
    await db
      .insert(bridgeConnection)
      .values({
        instanceId: inst.id,
        lastSeen: now,
        deviceName: body.deviceName ?? null,
        appVersion: body.appVersion ?? null,
        deviceType,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [bridgeConnection.instanceId, bridgeConnection.deviceType],
        set: {
          lastSeen: now,
          ...(body.deviceName ? { deviceName: body.deviceName } : {}),
          ...(body.appVersion ? { appVersion: body.appVersion } : {}),
          updatedAt: now,
        },
      });

    // Check if a mobile bridge is also connected
    const mobileBridge =
      deviceType === "desktop"
        ? await db.query.bridgeConnection.findFirst({
            where: and(
              eq(bridgeConnection.instanceId, inst.id),
              eq(bridgeConnection.deviceType, "mobile"),
            ),
          })
        : null;
    const hasMobile =
      deviceType === "mobile" ||
      (mobileBridge ? isConnected(mobileBridge.lastSeen) : false);

    if (wasDisconnected) {
      syncToolsMd(inst.id, bridge.capabilities, true, hasMobile);
      notifyBridgeState(inst.id, true);

      audit(
        inst.id,
        "connect",
        "success",
        {
          deviceName: body.deviceName,
          appVersion: body.appVersion,
          capabilities: bridge.capabilities,
        },
        Date.now() - start,
        ip,
      );
    }

    return c.json({
      ok: true,
      instanceId: inst.id,
      gatewayHost: `${inst.id}.clawin1click.com`,
      terminalConfig: bridge.terminalConfig,
      fileConfig: bridge.fileConfig,
      notificationConfig: bridge.notificationConfig,
    });
  })

  // ─── Mobile Companion (CB-3.4) ─────────────────────────────────────

  // POST /api/bridge/mobile/request — Agent creates a mobile tool request
  .post("/mobile/request", rateLimit(10, 60_000), async (c) => {
    const start = Date.now();
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const body = await c.req
      .json<{ tool: string; args?: Record<string, unknown> }>()
      .catch(() => null);

    if (!body?.tool || !MOBILE_TOOLS.includes(body.tool)) {
      return c.json(
        {
          error: `Invalid tool. Must be one of: ${MOBILE_TOOLS.join(", ")}`,
        },
        400,
      );
    }

    // Check mobile bridge is connected
    const mobileBridge = await db.query.bridgeConnection.findFirst({
      where: and(
        eq(bridgeConnection.instanceId, inst.id),
        eq(bridgeConnection.deviceType, "mobile"),
      ),
    });

    if (!mobileBridge || !isConnected(mobileBridge.lastSeen)) {
      return c.json({ error: "No mobile companion connected" }, 404);
    }

    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
    const [request] = await db
      .insert(bridgeMobileRequest)
      .values({
        instanceId: inst.id,
        tool: body.tool,
        args: body.args ?? {},
        status: "pending",
        expiresAt,
      })
      .returning();

    audit(
      inst.id,
      "mobile_request",
      "created",
      { tool: body.tool, requestId: request!.id },
      Date.now() - start,
      ip,
    );

    return c.json({ requestId: request!.id });
  })

  // GET /api/bridge/mobile/result/:id — Agent polls for result
  .get("/mobile/result/:id", rateLimit(20, 60_000), async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const id = c.req.param("id");
    const request = await db.query.bridgeMobileRequest.findFirst({
      where: and(
        eq(bridgeMobileRequest.id, id),
        eq(bridgeMobileRequest.instanceId, inst.id),
      ),
    });

    if (!request) {
      return c.json({ error: "Request not found" }, 404);
    }

    // Check expiration
    if (
      request.status === "pending" &&
      request.expiresAt &&
      new Date(request.expiresAt) < new Date()
    ) {
      await db
        .update(bridgeMobileRequest)
        .set({ status: "expired" })
        .where(eq(bridgeMobileRequest.id, id));
      return c.json({ status: "expired" }, 410);
    }

    if (request.status === "completed") {
      return c.json({ status: "completed", result: request.result });
    }
    if (request.status === "error") {
      return c.json({ status: "error", error: request.error });
    }
    if (request.status === "expired") {
      return c.json({ status: "expired" }, 410);
    }

    return c.json({ status: request.status });
  })

  // GET /api/bridge/mobile/poll — Mobile app polls for pending requests
  .get("/mobile/poll", rateLimit(20, 60_000), async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    // Expire old requests lazily
    await db
      .update(bridgeMobileRequest)
      .set({ status: "expired" })
      .where(
        and(
          eq(bridgeMobileRequest.instanceId, inst.id),
          eq(bridgeMobileRequest.status, "pending"),
          lt(bridgeMobileRequest.expiresAt, new Date()),
        ),
      )
      .catch(() => undefined);

    const pending = await db.query.bridgeMobileRequest.findMany({
      where: and(
        eq(bridgeMobileRequest.instanceId, inst.id),
        eq(bridgeMobileRequest.status, "pending"),
      ),
      orderBy: bridgeMobileRequest.createdAt,
      limit: 5,
    });

    return c.json({ requests: pending });
  })

  // POST /api/bridge/mobile/claim/:id — Mobile claims a request
  .post("/mobile/claim/:id", rateLimit(20, 60_000), async (c) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const id = c.req.param("id");
    const [updated] = await db
      .update(bridgeMobileRequest)
      .set({ status: "claimed", claimedAt: new Date() })
      .where(
        and(
          eq(bridgeMobileRequest.id, id),
          eq(bridgeMobileRequest.instanceId, inst.id),
          eq(bridgeMobileRequest.status, "pending"),
        ),
      )
      .returning();

    if (!updated) {
      return c.json({ error: "Request not found or already claimed" }, 404);
    }

    return c.json({ ok: true });
  })

  // POST /api/bridge/mobile/complete/:id — Mobile submits result
  .post("/mobile/complete/:id", rateLimit(10, 60_000), async (c) => {
    const start = Date.now();
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const id = c.req.param("id");
    const body = await c.req.json<{ result: unknown }>().catch(() => null);

    if (!body?.result) {
      return c.json({ error: "Missing result" }, 400);
    }

    const [updated] = await db
      .update(bridgeMobileRequest)
      .set({
        status: "completed",
        result: body.result as Record<string, unknown>,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(bridgeMobileRequest.id, id),
          eq(bridgeMobileRequest.instanceId, inst.id),
          eq(bridgeMobileRequest.status, "claimed"),
        ),
      )
      .returning();

    if (!updated) {
      return c.json({ error: "Request not found or not claimed" }, 404);
    }

    audit(
      inst.id,
      "mobile_complete",
      "success",
      { tool: updated.tool, requestId: id },
      Date.now() - start,
      ip,
    );

    return c.json({ ok: true });
  })

  // POST /api/bridge/mobile/reject/:id — Mobile rejects a request
  .post("/mobile/reject/:id", rateLimit(10, 60_000), async (c) => {
    const start = Date.now();
    const ip = getClientIp(c);
    const authHeader = c.req.header("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid token" }, 401);
    }

    const token = authHeader.slice(7);
    const inst = await db.query.instance.findFirst({
      where: eq(instance.token, token),
      columns: { id: true },
    });

    if (!inst) {
      return c.json({ error: "Invalid token" }, 401);
    }

    const id = c.req.param("id");
    const body = await c.req.json<{ reason?: string }>().catch(() => ({}));

    const [updated] = await db
      .update(bridgeMobileRequest)
      .set({
        status: "error",
        error: (body as { reason?: string }).reason ?? "User denied",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(bridgeMobileRequest.id, id),
          eq(bridgeMobileRequest.instanceId, inst.id),
        ),
      )
      .returning();

    if (!updated) {
      return c.json({ error: "Request not found" }, 404);
    }

    audit(
      inst.id,
      "mobile_reject",
      "denied",
      { tool: updated.tool, requestId: id },
      Date.now() - start,
      ip,
    );

    return c.json({ ok: true });
  })

  // --- Auto-Update Check ---

  .get("/updates/latest", (c) => {
    // Returns the latest Bridge app release info.
    // The client compares versions locally.
    // Update this when building new Bridge releases.
    const LATEST_RELEASE = {
      version: "0.1.0",
      notes: "",
      critical: false,
      platforms: {
        "windows-x86_64": {
          url: "",
        },
      },
      pubDate: "2026-03-13T00:00:00Z",
    };

    return c.json(LATEST_RELEASE);
  });
