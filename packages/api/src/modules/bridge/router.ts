import { Hono } from "hono";
import crypto from "node:crypto";

import { eq } from "@workspace/db";
import {
  bridgeAuditLog,
  bridgeConnection,
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

  if (sections.length === 0) return null;
  return sections.join("\n\n");
}

// --- Helpers ---

async function getOrCreateBridge(instanceId: string) {
  const existing = await db.query.bridgeConnection.findFirst({
    where: eq(bridgeConnection.instanceId, instanceId),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(bridgeConnection)
    .values({ instanceId })
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
): void {
  const section = connected ? generateBridgeToolsSection(capabilities) : null;

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
      .json<{ deviceName?: string; appVersion?: string }>()
      .catch((): { deviceName?: string; appVersion?: string } => ({}));

    const bridge = await getOrCreateBridge(inst.id);
    const wasDisconnected = !isConnected(bridge.lastSeen);

    const now = new Date();
    await db
      .insert(bridgeConnection)
      .values({
        instanceId: inst.id,
        lastSeen: now,
        deviceName: body.deviceName ?? null,
        appVersion: body.appVersion ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: bridgeConnection.instanceId,
        set: {
          lastSeen: now,
          ...(body.deviceName ? { deviceName: body.deviceName } : {}),
          ...(body.appVersion ? { appVersion: body.appVersion } : {}),
          updatedAt: now,
        },
      });

    if (wasDisconnected) {
      syncToolsMd(inst.id, bridge.capabilities, true);
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
    });
  });
