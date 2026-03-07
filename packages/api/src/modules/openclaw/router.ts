import crypto from "node:crypto";
import { Hono } from "hono";

import {
  deployInstanceSchema,
  ManageInstanceAction,
  manageInstanceSchema,
  aiKeysSchema,
} from "@workspace/openclaw";
import { getCommandToRun, commandSchema } from "@workspace/openclaw/cli";
import {
  createInstance,
  deploy,
  getStatus,
  getLogs,
  getInstanceByUserId,
  manage,
  deleteInstance,
  updateInstance,
  getUrl,
  getPairingRequests,
  cli,
  updateKeys,
  getSkillsByInstanceId,
  upsertSkill,
  downloadSkillBinary,
  updateOpenclawJson,
  restartContainer,
  gogSetupStep1,
  gogSetupStep2,
  clawhubExec,
} from "@workspace/openclaw/server";

import { fetchClawHub } from "./store-cache";
import { Model, MODELS } from "@workspace/openclaw/config";

import {
  enforceAuth,
  validate,
  enforceInstance,
  enforceNoInstance,
  enforceSubscription,
} from "../../middleware";

import { selectBestVps } from "../admin/vps-selector";
import { getVpsById } from "../admin/vps-config";

import type { AiKeysInput } from "@workspace/openclaw";
import { encrypt, decrypt, isEncrypted } from "@workspace/shared/crypto";
import { env } from "../../env";


const maskKey = (key: string | null | undefined): string => {
  if (!key || key.length < 8) return "";
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
};

// Mapping: API key field → Model constant
const KEY_TO_MODEL: Record<string, Model> = {
  anthropicApiKey: Model.CLAUDE_OPUS_4_6,
  openaiApiKey: Model.GPT_5_2,
  googleApiKey: Model.GEMINI_3_0_FLASH,
};

// Priority order for model auto-selection
const KEY_PRIORITY = ["anthropicApiKey", "openaiApiKey", "googleApiKey"] as const;

const toAgentModelId = (model: Model): string => {
  const modelInfo = MODELS.find((m) => m.id === model);
  if (!modelInfo) return model;
  return `${modelInfo.provider}/${modelInfo.id}`;
};

/**
 * Routes updateKeys to the correct VPS (local via SSH or remote via HTTP agent).
 */
const routeUpdateKeys = async (
  instanceId: string,
  vpsId: string,
  aiKeys: AiKeysInput,
  model?: string,
) => {
  const vps = await getVpsById(vpsId);

  if (!vps || vps.endpoint === "local") {
    return updateKeys(instanceId, aiKeys, model);
  }

  // Remote VPS — delegate to agent HTTP
  const res = await fetch(`${vps.endpoint}/update-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vps.token ?? ""}`,
    },
    body: JSON.stringify({ instanceId, aiKeys, model }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => "Unknown error");
    throw new Error(`Remote updateKeys failed on ${vps.name}: ${error}`);
  }

  return res.json();
};


// Helper to encrypt API keys before storing in DB
async function encryptKeys(
  keys: { openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null },
  encryptionKey: string | undefined,
) {
  if (!encryptionKey) return keys;
  const enc = async (v: string | null | undefined) =>
    v ? (isEncrypted(v) ? v : await encrypt(v, encryptionKey)) : v ?? null;
  return {
    openaiApiKey: await enc(keys.openaiApiKey),
    anthropicApiKey: await enc(keys.anthropicApiKey),
    googleApiKey: await enc(keys.googleApiKey),
  };
}

// Helper to decrypt API keys after reading from DB
async function decryptKeys(
  keys: { openaiApiKey?: string | null; anthropicApiKey?: string | null; googleApiKey?: string | null },
  encryptionKey: string | undefined,
) {
  if (!encryptionKey) return keys;
  const dec = async (v: string | null | undefined) => {
    if (!v) return v ?? null;
    try {
      return isEncrypted(v) ? await decrypt(v, encryptionKey) : v;
    } catch {
      return v;
    }
  };
  return {
    openaiApiKey: await dec(keys.openaiApiKey),
    anthropicApiKey: await dec(keys.anthropicApiKey),
    googleApiKey: await dec(keys.googleApiKey),
  };
}

export const openclawRouter = new Hono()
  .use(enforceAuth)
  .post(
    "/",
    enforceNoInstance,
    enforceSubscription,
    validate("json", deployInstanceSchema),
    async (c) => {
      const userId = c.var.user.id;
      const payload = c.req.valid("json");

      const vpsId = await selectBestVps();
      const vps = await getVpsById(vpsId);

      let deployment: { id: string; token: string };

      if (!vps || vps.endpoint === "local") {
        deployment = await deploy({ userId, ...payload });
      } else {
        const res = await fetch(`${vps.endpoint}/deploy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vps.token ?? ""}`,
          },
          body: JSON.stringify({ userId, ...payload }),
          signal: AbortSignal.timeout(120000),
        });

        if (!res.ok) {
          const error = await res.text().catch(() => "Unknown error");
          throw new Error(`Remote deploy failed on ${vps.name}: ${error}`);
        }

        deployment = (await res.json()) as { id: string; token: string };
      }

      const rawKeys = {
        openaiApiKey: payload.aiKeys?.openaiApiKey || null,
        anthropicApiKey: payload.aiKeys?.anthropicApiKey || null,
        googleApiKey: payload.aiKeys?.googleApiKey || null,
      };
      const encryptedKeys = await encryptKeys(rawKeys, env.ENCRYPTION_KEY);
      await createInstance({
        userId,
        communicationChannel: payload.communication.channel,
        vpsId,
        ...encryptedKeys,
        ...deployment,
        ...payload,
      });

      return c.json(deployment, 202);
    },
  )
  .get("/", async (c) => {
    const userId = c.var.user.id;
    const inst = await getInstanceByUserId(userId);

    if (!inst) {
      return c.json(null);
    }

    const url = getUrl(inst.id, inst.token);

    // Exclude raw API keys from the response
    const {
      openaiApiKey: _oai,
      anthropicApiKey: _ant,
      googleApiKey: _goo,
      ...safeInstance
    } = inst;

    return c.json({
      ...safeInstance,
      url,
    });
  })
  .get("/status", enforceInstance, async (c) => {
    const { instanceId, vpsId } = c.var;
    const vps = await getVpsById(vpsId);
    if (!vps || vps.endpoint === "local") {
      return c.json(await getStatus(instanceId));
    }
    // Remote VPS — delegate to agent
    const res = await fetch(`${vps.endpoint}/status/${instanceId}`, {
      headers: { Authorization: `Bearer ${vps.token ?? ""}` },
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    const data: Awaited<ReturnType<typeof getStatus>> = res?.ok
      ? (await res.json() as Awaited<ReturnType<typeof getStatus>>)
      : null;
    return c.json(data);
  })
  .get("/logs", enforceInstance, async (c) => {
    const { instanceId, vpsId } = c.var;
    const vps = await getVpsById(vpsId);
    if (!vps || vps.endpoint === "local") {
      return c.json(await getLogs(instanceId));
    }
    // Remote VPS — delegate to agent
    const res = await fetch(`${vps.endpoint}/logs/${instanceId}`, {
      headers: { Authorization: `Bearer ${vps.token ?? ""}` },
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    const data: Awaited<ReturnType<typeof getLogs>> = res?.ok
      ? (await res.json() as Awaited<ReturnType<typeof getLogs>>)
      : { stdout: "", stderr: "" };
    return c.json(data);
  })
  .get("/pairing", enforceInstance, async (c) => {
    const { instanceId, vpsId } = c.var;
    const vps = await getVpsById(vpsId);
    if (!vps || vps.endpoint === "local") {
      return c.json(await getPairingRequests(instanceId));
    }
    // Remote VPS — delegate to agent
    const res = await fetch(`${vps.endpoint}/pairing/${instanceId}`, {
      headers: { Authorization: `Bearer ${vps.token ?? ""}` },
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    const data: Awaited<ReturnType<typeof getPairingRequests>> = res?.ok
      ? (await res.json() as Awaited<ReturnType<typeof getPairingRequests>>)
      : [];
    return c.json(data);
  })
  .get("/keys", enforceInstance, async (c) => {
    const userId = c.var.user.id;
    const inst = await getInstanceByUserId(userId);

    if (!inst) {
      return c.json(null, 404);
    }

    const decrypted = await decryptKeys(inst, env.ENCRYPTION_KEY);
    return c.json({
      openaiApiKey: maskKey(decrypted.openaiApiKey),
      anthropicApiKey: maskKey(decrypted.anthropicApiKey),
      googleApiKey: maskKey(decrypted.googleApiKey),
    });
  })
  .put("/keys", enforceInstance, validate("json", aiKeysSchema), async (c) => {
    const instanceId = c.var.instanceId;
    const userId = c.var.user.id;
    const payload = c.req.valid("json");

    const inst = await getInstanceByUserId(userId);
    if (!inst) {
      return c.json(null, 404);
    }

    // Decrypt existing DB values so we can fall back to them
    const existingDecrypted = await decryptKeys(inst, env.ENCRYPTION_KEY);

    // Only update keys that were actually provided (non-empty)
    const mergedKeys = {
      openaiApiKey: payload.openaiApiKey || existingDecrypted.openaiApiKey,
      anthropicApiKey: payload.anthropicApiKey || existingDecrypted.anthropicApiKey,
      googleApiKey: payload.googleApiKey || existingDecrypted.googleApiKey,
    };

    // Detect which key was provided and auto-select the corresponding model
    // Priority: Anthropic > OpenAI > Google
    let newModel: Model | null = null;
    for (const key of KEY_PRIORITY) {
      if (payload[key]) {
        newModel = KEY_TO_MODEL[key] ?? null;
        break;
      }
    }

    // Encrypt before storing
    const newKeys = await encryptKeys(mergedKeys, env.ENCRYPTION_KEY);

    // Update in DB (include model if auto-selected)
    await updateInstance(instanceId, {
      ...newKeys,
      ...(newModel ? { model: newModel } : {}),
    });

    // Compute the full model ID for openclaw.json (e.g. "openai/gpt-5.2")
    const agentModelId = newModel ? toAgentModelId(newModel) : undefined;

    // Recreate Docker container on the correct VPS with new env vars (plaintext keys)
    await routeUpdateKeys(
      instanceId,
      inst.vpsId,
      {
        openaiApiKey: mergedKeys.openaiApiKey ?? undefined,
        anthropicApiKey: mergedKeys.anthropicApiKey ?? undefined,
        googleApiKey: mergedKeys.googleApiKey ?? undefined,
      },
      agentModelId,
    );

    return c.json({
      openaiApiKey: maskKey(mergedKeys.openaiApiKey),
      anthropicApiKey: maskKey(mergedKeys.anthropicApiKey),
      googleApiKey: maskKey(mergedKeys.googleApiKey),
    });
  })
  .post(
    "/manage",
    enforceInstance,
    validate("json", manageInstanceSchema),
    async (c) => {
      const instanceId = c.var.instanceId;
      const vpsId = c.var.vpsId;
      const payload = c.req.valid("json");

      const vps = await getVpsById(vpsId);
      let result: unknown;

      if (!vps || vps.endpoint === "local") {
        result = await manage(instanceId, payload.action);
      } else {
        // Remote VPS — delegate to agent
        const res = await fetch(`${vps.endpoint}/manage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${vps.token ?? ""}`,
          },
          body: JSON.stringify({ instanceId, action: payload.action }),
          signal: AbortSignal.timeout(120_000),
        });
        if (!res.ok) throw new Error(`Remote manage failed on ${vps.name}`);
        result = await res.json();
      }

      if (payload.action === ManageInstanceAction.DESTROY) {
        await deleteInstance(instanceId);
      }

      return c.json(result);
    },
  )
  .post("/cli", enforceInstance, validate("json", commandSchema), async (c) => {
    const instanceId = c.var.instanceId;
    const vpsId = c.var.vpsId;
    const payload = c.req.valid("json");

    const command = getCommandToRun(payload);
    const vps = await getVpsById(vpsId);

    if (!vps || vps.endpoint === "local") {
      return c.json(await cli(instanceId, command));
    }

    // Remote VPS — delegate to agent
    const res = await fetch(`${vps.endpoint}/cli`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${vps.token ?? ""}`,
      },
      body: JSON.stringify({ instanceId, command }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`Remote CLI failed on ${vps.name}`);
    return c.json(await res.json());
  })
  .get("/skills", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;

    const SKILLS_CATALOG = [
      { name: "canvas", category: "auto", displayName: "Canvas", description: "Visual canvas for diagrams and drawings", requiresBinary: null, requiresCredentials: false },
      { name: "coding-agent", category: "auto", displayName: "Coding Agent", description: "AI-powered code generation and editing", requiresBinary: null, requiresCredentials: false },
      { name: "healthcheck", category: "auto", displayName: "Health Check", description: "System health monitoring", requiresBinary: null, requiresCredentials: false },
      { name: "skill-creator", category: "auto", displayName: "Skill Creator", description: "Create custom skills", requiresBinary: null, requiresCredentials: false },
      { name: "notion", category: "config", displayName: "Notion", description: "Notion workspace integration", requiresBinary: null, requiresCredentials: true, credentialFields: ["NOTION_TOKEN"], credentialUrl: "https://www.notion.so/profile/integrations" },
      { name: "slack", category: "config", displayName: "Slack", description: "Slack messaging integration", requiresBinary: null, requiresCredentials: true, credentialFields: ["SLACK_TOKEN"], credentialUrl: "https://api.slack.com/apps" },
      { name: "discord", category: "config", displayName: "Discord", description: "Discord messaging integration", requiresBinary: null, requiresCredentials: true, credentialFields: ["DISCORD_TOKEN"], credentialUrl: "https://discord.com/developers/applications" },
      { name: "github", category: "install", displayName: "GitHub", description: "GitHub repositories and issues", requiresBinary: "gh" as const, requiresCredentials: true, credentialFields: ["GH_TOKEN"], credentialUrl: "https://github.com/settings/tokens" },
      { name: "gog", category: "install", displayName: "Google Workspace (GoG)", description: "Gmail, Calendar, Drive integration", requiresBinary: "gog" as const, requiresCredentials: true, credentialFields: ["oauth"], credentialUrl: "https://console.cloud.google.com/apis/credentials" },
    ];

    const dbSkills = await getSkillsByInstanceId(instanceId);
    const dbMap = new Map(dbSkills.map((s) => [s.skillName, s]));

    const skills = SKILLS_CATALOG.map((skill) => {
      const dbRecord = dbMap.get(skill.name);
      const isAutoEnabled = skill.category === "auto";
      return {
        ...skill,
        enabled: dbRecord?.enabled ?? isAutoEnabled,
        configured: dbRecord ? !dbRecord.lastError : isAutoEnabled,
        installedAt: dbRecord?.installedAt ?? null,
        lastError: dbRecord?.lastError ?? null,
      };
    });

    return c.json({
      categories: {
        auto: skills.filter((s) => s.category === "auto"),
        config: skills.filter((s) => s.category === "config"),
        install: skills.filter((s) => s.category === "install"),
      },
    });
  })
  .put("/skills/:skillName", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const skillName = c.req.param("skillName");
    const body = await c.req.json<{
      enabled?: boolean;
      credentials?: Record<string, string>;
    }>();

    const SKILL_BINARIES: Record<string, "gog" | "gh"> = {
      github: "gh",
      gog: "gog",
    };

    const binaryName = SKILL_BINARIES[skillName];

    if (body.enabled && binaryName) {
      const result = await downloadSkillBinary(instanceId, binaryName);
      if (!result.success) {
        await upsertSkill(instanceId, skillName, {
          enabled: false,
          lastError: result.error ?? "Binary download failed",
        });
        return c.json({ error: `Failed to install ${skillName}: ${result.error}` }, 500);
      }
      await upsertSkill(instanceId, skillName, {
        enabled: true,
        installedAt: new Date(),
        lastError: null,
      });
    } else {
      await upsertSkill(instanceId, skillName, {
        enabled: body.enabled ?? false,
      });
    }

    if (body.credentials) {
      const encryptedCreds: Record<string, string> = {};
      for (const [key, value] of Object.entries(body.credentials)) {
        encryptedCreds[key] = env.ENCRYPTION_KEY
          ? await encrypt(value, env.ENCRYPTION_KEY)
          : value;
      }
      await upsertSkill(instanceId, skillName, {
        credentials: encryptedCreds,
      });
    }

    const allDbSkills = await getSkillsByInstanceId(instanceId);
    const skillsEntries: Record<string, { enabled: boolean }> = {};
    for (const s of allDbSkills) {
      if (s.enabled) {
        skillsEntries[s.skillName] = { enabled: true };
      }
    }

    for (const name of ["canvas", "coding-agent", "healthcheck", "skill-creator"]) {
      if (!skillsEntries[name]) {
        skillsEntries[name] = { enabled: true };
      }
    }

    try {
      await updateOpenclawJson(instanceId, (config) => ({
        ...config,
        skills: { entries: skillsEntries },
      }));
      await restartContainer(instanceId);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      await upsertSkill(instanceId, skillName, { lastError: errMsg });
      return c.json({ error: `Config update failed: ${errMsg}` }, 500);
    }

    return c.json({ success: true, skillName, enabled: body.enabled ?? false });
  })
  .post("/skills/gog/setup", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const body = await c.req.json<{
      step: 1 | 2;
      clientSecret?: string;
      email?: string;
      callbackUrl?: string;
    }>();

    if (body.step === 1) {
      if (!body.clientSecret || !body.email) {
        return c.json({ error: "clientSecret and email are required for step 1" }, 400);
      }

      // Generate or retrieve keyring password
      const existingSkill = (await getSkillsByInstanceId(instanceId)).find(
        (s) => s.skillName === "gog",
      );
      let keyringPassword: string;
      if (existingSkill?.config && (existingSkill.config as Record<string, string>).keyringPassword) {
        const stored = (existingSkill.config as Record<string, string>).keyringPassword!;
        if (env.ENCRYPTION_KEY) {
          const decrypted = await decrypt(stored, env.ENCRYPTION_KEY);
          keyringPassword = decrypted ?? stored;
        } else {
          keyringPassword = stored;
        }
      } else {
        keyringPassword = crypto.randomBytes(32).toString("hex");
        const encryptedKP = env.ENCRYPTION_KEY
          ? await encrypt(keyringPassword, env.ENCRYPTION_KEY)
          : keyringPassword;
        await upsertSkill(instanceId, "gog", {
          config: { keyringPassword: encryptedKP, email: body.email },
        });
      }

      // Download gog binary if not already installed
      const dlResult = await downloadSkillBinary(instanceId, "gog");
      if (!dlResult.success) {
        return c.json({ error: `Failed to install gog binary: ${dlResult.error}` }, 500);
      }

      try {
        const result = await gogSetupStep1(
          instanceId,
          body.clientSecret,
          body.email,
          keyringPassword,
        );
        return c.json({ authUrl: result.authUrl });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        await upsertSkill(instanceId, "gog", { lastError: errMsg });
        return c.json({ error: `GoG setup step 1 failed: ${errMsg}` }, 500);
      }
    }

    if (body.step === 2) {
      if (!body.callbackUrl) {
        return c.json({ error: "callbackUrl is required for step 2" }, 400);
      }

      const existingSkill = (await getSkillsByInstanceId(instanceId)).find(
        (s) => s.skillName === "gog",
      );
      const config = (existingSkill?.config ?? {}) as Record<string, string>;
      if (!config.keyringPassword || !config.email) {
        return c.json({ error: "Run step 1 first" }, 400);
      }

      let keyringPassword: string;
      if (env.ENCRYPTION_KEY) {
        const decrypted = await decrypt(config.keyringPassword, env.ENCRYPTION_KEY);
        keyringPassword = decrypted ?? config.keyringPassword;
      } else {
        keyringPassword = config.keyringPassword;
      }

      try {
        const result = await gogSetupStep2(
          instanceId,
          config.email,
          body.callbackUrl,
          keyringPassword,
        );

        await upsertSkill(instanceId, "gog", {
          enabled: true,
          installedAt: new Date(),
          lastError: null,
        });

        // Update openclaw.json with GoG enabled + env vars
        const allDbSkills = await getSkillsByInstanceId(instanceId);
        const skillsEntries: Record<string, { enabled: boolean }> = {};
        for (const s of allDbSkills) {
          if (s.enabled) {
            skillsEntries[s.skillName] = { enabled: true };
          }
        }
        for (const name of ["canvas", "coding-agent", "healthcheck", "skill-creator"]) {
          if (!skillsEntries[name]) {
            skillsEntries[name] = { enabled: true };
          }
        }

        await updateOpenclawJson(instanceId, (cfg) => ({
          ...cfg,
          skills: { entries: skillsEntries },
        }));

        await restartContainer(instanceId);

        return c.json({ success: true, account: result.account });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        await upsertSkill(instanceId, "gog", { lastError: errMsg });
        return c.json({ error: `GoG setup step 2 failed: ${errMsg}` }, 500);
      }
    }

    return c.json({ error: "Invalid step. Use 1 or 2." }, 400);
  })
  // --- Store Routes ---
  .get("/store/catalog", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const sort = c.req.query("sort") || "downloads";
    const limit = c.req.query("limit") || "20";
    const cursor = c.req.query("cursor") || undefined;

    try {
      const params: Record<string, string | number> = { sort, limit };
      if (cursor) params.cursor = cursor;

      const data = await fetchClawHub<{
        items: Array<{
          slug: string;
          displayName: string;
          summary: string;
          tags: Record<string, string>;
          stats: { downloads: number; stars: number; installsAllTime: number; installsCurrent: number; comments: number; versions: number };
          createdAt: number;
          updatedAt: number;
          latestVersion: { version: string; createdAt: number; changelog: string } | null;
          metadata: Record<string, unknown> | null;
        }>;
        nextCursor: string | null;
      }>("/skills", params);

      const dbSkills = await getSkillsByInstanceId(instanceId);
      const installedSlugs = new Set(
        dbSkills.filter((s) => s.source === "store" && s.enabled).map((s) => s.skillName),
      );

      const skills = (data.items ?? []).map((s) => ({
        slug: s.slug,
        displayName: s.displayName,
        summary: s.summary,
        tags: Object.keys(s.tags ?? {}),
        downloads: s.stats?.downloads ?? 0,
        stars: s.stats?.stars ?? 0,
        installs: s.stats?.installsCurrent ?? 0,
        latestVersion: s.latestVersion?.version ?? null,
        installed: installedSlugs.has(s.slug),
      }));

      return c.json({
        skills,
        nextCursor: data.nextCursor ?? null,
        hasMore: !!data.nextCursor,
      });
    } catch (error) {
      return c.json(
        { error: "clawhub_api_error", message: "ClawHub API unavailable" },
        502,
      );
    }
  })
  .get("/store/search", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const q = c.req.query("q") || "";

    if (q.length < 2) {
      return c.json({ error: "Query must be at least 2 characters" }, 400);
    }

    try {
      const data = await fetchClawHub<{
        results: Array<{
          score: number;
          slug: string;
          displayName: string;
          summary: string;
          version: string | null;
          updatedAt: number;
        }>;
      }>("/search", { q });

      const dbSkills = await getSkillsByInstanceId(instanceId);
      const installedSlugs = new Set(
        dbSkills.filter((s) => s.source === "store" && s.enabled).map((s) => s.skillName),
      );

      const skills = (data.results ?? []).map((s) => ({
        slug: s.slug,
        displayName: s.displayName,
        summary: s.summary,
        score: s.score,
        latestVersion: s.version,
        installed: installedSlugs.has(s.slug),
      }));

      return c.json({ skills, total: skills.length });
    } catch (error) {
      return c.json(
        { error: "clawhub_api_error", message: "ClawHub API unavailable" },
        502,
      );
    }
  })
  .post("/store/install", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const body = await c.req.json<{ slug: string; force?: boolean }>();

    if (!body.slug) {
      return c.json({ error: "slug is required" }, 400);
    }

    const existing = await getSkillsByInstanceId(instanceId);
    const alreadyInstalled = existing.find(
      (s) => s.skillName === body.slug && s.source === "store" && s.enabled,
    );
    if (alreadyInstalled) {
      return c.json({ error: "already_installed", message: "Skill already installed" }, 409);
    }

    const args = ["install", body.slug];
    if (body.force) args.push("--force");

    try {
      const result = await clawhubExec(instanceId, args);

      if (result.stderr?.includes("suspicious") && !body.force) {
        return c.json(
          { error: "suspicious_skill", message: "Skill flagged as suspicious. Use force: true to proceed.", requiresForce: true },
          409,
        );
      }

      await upsertSkill(instanceId, body.slug, {
        enabled: true,
        source: "store",
        installedAt: new Date(),
        lastError: null,
      });

      const allDbSkills = await getSkillsByInstanceId(instanceId);
      const skillsEntries: Record<string, { enabled: boolean }> = {};
      for (const s of allDbSkills) {
        if (s.enabled) {
          skillsEntries[s.skillName] = { enabled: true };
        }
      }
      for (const name of ["canvas", "coding-agent", "healthcheck", "skill-creator"]) {
        if (!skillsEntries[name]) {
          skillsEntries[name] = { enabled: true };
        }
      }
      await updateOpenclawJson(instanceId, (cfg) => ({
        ...cfg,
        skills: { entries: skillsEntries },
      }));

      await restartContainer(instanceId);

      return c.json({ success: true, slug: body.slug });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("not found") || errMsg.includes("404")) {
        return c.json({ error: "skill_not_found", message: `Skill '${body.slug}' not found` }, 404);
      }
      await upsertSkill(instanceId, body.slug, { lastError: errMsg });
      return c.json({ error: "install_failed", message: errMsg }, 500);
    }
  })
  .post("/store/uninstall", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const body = await c.req.json<{ slug: string }>();

    if (!body.slug) {
      return c.json({ error: "slug is required" }, 400);
    }

    try {
      await clawhubExec(instanceId, ["uninstall", body.slug, "--yes"]);

      await upsertSkill(instanceId, body.slug, {
        enabled: false,
        lastError: null,
      });

      const allDbSkills = await getSkillsByInstanceId(instanceId);
      const skillsEntries: Record<string, { enabled: boolean }> = {};
      for (const s of allDbSkills) {
        if (s.enabled) {
          skillsEntries[s.skillName] = { enabled: true };
        }
      }
      for (const name of ["canvas", "coding-agent", "healthcheck", "skill-creator"]) {
        if (!skillsEntries[name]) {
          skillsEntries[name] = { enabled: true };
        }
      }
      await updateOpenclawJson(instanceId, (cfg) => ({
        ...cfg,
        skills: { entries: skillsEntries },
      }));

      await restartContainer(instanceId);

      return c.json({ success: true, slug: body.slug });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return c.json({ error: "uninstall_failed", message: errMsg }, 500);
    }
  })
  .get("/store/installed", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;

    try {
      let cliSkills: Array<{ slug: string; version: string }> = [];
      try {
        const result = await clawhubExec(instanceId, ["list", "--json"]);
        const parsed = JSON.parse(result.stdout) as { skills?: Array<{ slug: string; version: string }> } | Array<{ slug: string; version: string }>;
        cliSkills = Array.isArray(parsed) ? parsed : parsed.skills ?? [];
      } catch {
        // CLI might not support --json, fall back to DB only
      }

      const dbSkills = await getSkillsByInstanceId(instanceId);
      const storeSkills = dbSkills.filter((s) => s.source === "store");

      const cliMap = new Map(cliSkills.map((s) => [s.slug, s]));

      const installed = storeSkills.map((s) => ({
        slug: s.skillName,
        version: cliMap.get(s.skillName)?.version ?? "unknown",
        enabled: s.enabled,
        installedAt: s.installedAt,
      }));

      return c.json({ skills: installed });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return c.json({ error: "list_failed", message: errMsg }, 500);
    }
  });
