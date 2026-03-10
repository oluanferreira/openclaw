import { Hono } from "hono";
import crypto from "node:crypto";

import {
  deployInstanceSchema,
  ManageInstanceAction,
  manageInstanceSchema,
  aiKeysSchema,
} from "@workspace/openclaw";
import { getCommandToRun, commandSchema } from "@workspace/openclaw/cli";
import {
  updateCommunicationSchema,
  maskToken,
} from "@workspace/openclaw/config";
import { PROVIDER_TO_KEY } from "@workspace/openclaw/config";
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
  readOpenclawJson,
  updateOpenclawJson,
  restartContainer,
  gogSetupStep1,
  gogSetupStep2,
} from "@workspace/openclaw/server";
import { encrypt, decrypt, isEncrypted } from "@workspace/shared/crypto";
import { isRedactedValue } from "@workspace/shared/utils";

import { env } from "../../env";
import {
  enforceAuth,
  validate,
  enforceInstance,
  enforceNoInstance,
  enforceSubscription,
} from "../../middleware";
import { getModelById, getActiveModels } from "../admin/models-config";
import { getVpsById } from "../admin/vps-config";
import { selectBestVps } from "../admin/vps-selector";

import type { AiKeysInput } from "@workspace/openclaw";


const maskKey = (key: string | null | undefined): string => {
  if (!key || key.length < 8) return "";
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
};

// Mapping: API key field -> provider for model auto-selection
const KEY_TO_PROVIDER: Record<string, string> = {
  anthropicApiKey: "anthropic",
  openaiApiKey: "openai",
  googleApiKey: "google",
};

// Priority order for model auto-selection
const KEY_PRIORITY = [
  "anthropicApiKey",
  "openaiApiKey",
  "googleApiKey",
] as const;

const toAgentModelId = (modelId: string, provider: string): string => {
  return `${provider}/${modelId}`;
};

/**
 * Routes updateKeys to the correct VPS (local via SSH or remote via HTTP agent).
 */
const routeUpdateKeys = async (
  instanceId: string,
  vpsId: string,
  aiKeys: AiKeysInput,
  model?: string,
  instanceToken?: string,
) => {
  const vps = await getVpsById(vpsId);

  if (!vps || vps.endpoint === "local") {
    return updateKeys(instanceId, aiKeys, model, instanceToken);
  }

  // Remote VPS — delegate to agent HTTP
  const res = await fetch(`${vps.endpoint}/update-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vps.token ?? ""}`,
    },
    body: JSON.stringify({ instanceId, aiKeys, model, instanceToken }),
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
  keys: {
    openaiApiKey?: string | null;
    anthropicApiKey?: string | null;
    googleApiKey?: string | null;
  },
  encryptionKey: string | undefined,
) {
  if (!encryptionKey) return keys;
  const enc = async (v: string | null | undefined) =>
    v ? (isEncrypted(v) ? v : await encrypt(v, encryptionKey)) : (v ?? null);
  return {
    openaiApiKey: await enc(keys.openaiApiKey),
    anthropicApiKey: await enc(keys.anthropicApiKey),
    googleApiKey: await enc(keys.googleApiKey),
  };
}

// Helper to decrypt API keys after reading from DB
async function decryptKeys(
  keys: {
    openaiApiKey?: string | null;
    anthropicApiKey?: string | null;
    googleApiKey?: string | null;
  },
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

      // Encrypt communication token (Telegram bot token) for DB storage
      const communicationToken =
        payload.communication.channel === "telegram"
          ? env.ENCRYPTION_KEY
            ? await encrypt(payload.communication.token, env.ENCRYPTION_KEY)
            : payload.communication.token
          : null;

      await createInstance({
        userId,
        communicationChannel: payload.communication.channel,
        communicationToken,
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

    // Best-effort sync: read live config from container and update DB if changed
    try {
      const liveConfig = (await readOpenclawJson(inst.id)) as {
        agents?: { defaults?: { model?: { primary?: string } } };
        channels?: { telegram?: { botToken?: string } };
      };
      const updates: Record<string, unknown> = {};

      // Sync model (skip redacted values — see isRedactedValue)
      const liveModel = liveConfig?.agents?.defaults?.model?.primary;
      if (
        liveModel &&
        typeof liveModel === "string" &&
        !isRedactedValue(liveModel)
      ) {
        const modelId = liveModel.includes("/")
          ? liveModel.split("/").pop()
          : liveModel;
        if (modelId && modelId !== inst.model) {
          updates.model = modelId;
        }
      }

      // Sync Telegram bot token (skip redacted values — see isRedactedValue)
      const liveBotToken = liveConfig?.channels?.telegram?.botToken;
      if (
        liveBotToken &&
        typeof liveBotToken === "string" &&
        !isRedactedValue(liveBotToken)
      ) {
        const dbToken =
          inst.communicationToken && env.ENCRYPTION_KEY
            ? await decrypt(inst.communicationToken, env.ENCRYPTION_KEY)
            : (inst.communicationToken ?? null);
        if (liveBotToken !== dbToken) {
          updates.communicationToken = env.ENCRYPTION_KEY
            ? await encrypt(liveBotToken, env.ENCRYPTION_KEY)
            : liveBotToken;
        }
      }

      if (Object.keys(updates).length > 0) {
        await updateInstance(inst.id, updates);
        Object.assign(inst, updates);
      }
    } catch {
      // Best-effort: if SSH fails, return DB data as-is
    }

    const url = getUrl(inst.id, inst.token);

    // Exclude raw API keys and communication token from the response
    const {
      openaiApiKey: _oai,
      anthropicApiKey: _ant,
      googleApiKey: _goo,
      communicationToken: _ct,
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
      ? ((await res.json()) as Awaited<ReturnType<typeof getStatus>>)
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
      ? ((await res.json()) as Awaited<ReturnType<typeof getLogs>>)
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
      ? ((await res.json()) as Awaited<ReturnType<typeof getPairingRequests>>)
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
      anthropicApiKey:
        payload.anthropicApiKey || existingDecrypted.anthropicApiKey,
      googleApiKey: payload.googleApiKey || existingDecrypted.googleApiKey,
    };

    // Detect which key was provided and auto-select the corresponding model
    // Priority: Anthropic > OpenAI > Google
    let newModelId: string | null = null;
    let newModelProvider: string | null = null;
    for (const key of KEY_PRIORITY) {
      if (payload[key]) {
        const provider = KEY_TO_PROVIDER[key];
        if (provider) {
          // Find first active model for this provider from DB
          const activeModels = await getActiveModels();
          const match = activeModels.find((m) => m.provider === provider);
          if (match) {
            newModelId = match.id;
            newModelProvider = match.provider;
          }
        }
        break;
      }
    }

    // Encrypt before storing
    const newKeys = await encryptKeys(mergedKeys, env.ENCRYPTION_KEY);

    // Update in DB (include model if auto-selected)
    await updateInstance(instanceId, {
      ...newKeys,
      ...(newModelId ? { model: newModelId } : {}),
    });

    // Compute the full model ID for openclaw.json (e.g. "openai/gpt-5.2")
    const agentModelId =
      newModelId && newModelProvider
        ? toAgentModelId(newModelId, newModelProvider)
        : undefined;

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
      inst.token,
    );

    return c.json({
      openaiApiKey: maskKey(mergedKeys.openaiApiKey),
      anthropicApiKey: maskKey(mergedKeys.anthropicApiKey),
      googleApiKey: maskKey(mergedKeys.googleApiKey),
    });
  })
  .get("/communication", enforceInstance, async (c) => {
    const userId = c.var.user.id;
    const inst = await getInstanceByUserId(userId);
    let channel = "";
    let maskedTk = "";
    let botNm = "";

    if (inst) {
      channel = inst.communicationChannel ?? "";
      if (inst.communicationToken) {
        try {
          const plainToken = env.ENCRYPTION_KEY
            ? await decrypt(inst.communicationToken, env.ENCRYPTION_KEY)
            : inst.communicationToken;
          if (plainToken && !isRedactedValue(plainToken)) {
            maskedTk = maskToken(plainToken) ?? "";
            const tgUrl =
              "https://api.telegram.org/bot" + plainToken + "/getMe";
            const res = await fetch(tgUrl, {
              signal: AbortSignal.timeout(5000),
            });
            if (res.ok) {
              const data = (await res.json()) as {
                result?: { first_name?: string; username?: string };
              };
              botNm = data.result?.first_name ?? data.result?.username ?? "";
            }
          }
        } catch {
          // Best-effort
        }
      }
    }

    return c.json({ channel, maskedToken: maskedTk, botName: botNm });
  })
  .put(
    "/communication",
    enforceInstance,
    validate("json", updateCommunicationSchema),
    async (c) => {
      const instanceId = c.var.instanceId;
      const vpsId = c.var.vpsId;
      const userId = c.var.user.id;
      const payload = c.req.valid("json");

      // Validate token with Telegram API
      let botName: string;
      try {
        const telegramUrl =
          "https://api.telegram.org/bot" + payload.token + "/getMe";
        const res = await fetch(telegramUrl, {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) {
          return c.json({ error: "Invalid Telegram bot token" }, 422);
        }
        const data = (await res.json()) as {
          result?: { first_name?: string; username?: string };
        };
        botName = data.result?.first_name ?? data.result?.username ?? "Bot";
      } catch {
        return c.json(
          { error: "Could not validate token with Telegram API" },
          422,
        );
      }

      // Encrypt and update DB
      const encryptedToken = env.ENCRYPTION_KEY
        ? await encrypt(payload.token, env.ENCRYPTION_KEY)
        : payload.token;

      await updateInstance(instanceId, {
        communicationToken: encryptedToken,
      });

      // Propagate to container: update openclaw.json + restart
      try {
        await updateOpenclawJson(instanceId, {
          channels: {
            telegram: {
              enabled: true,
              botToken: payload.token,
            },
          },
        });
        await restartContainer(instanceId);
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        return c.json(
          { error: "Token saved but container update failed: " + errMsg },
          500,
        );
      }

      return c.json({ success: true, botName });
    },
  )
  .put("/model", enforceInstance, async (c) => {
    const instanceId = c.var.instanceId;
    const vpsId = c.var.vpsId;
    const body = await c.req.json<{ model: string }>();

    if (!body.model || typeof body.model !== "string") {
      return c.json({ error: "Model is required" }, 422);
    }

    // Validate model exists in DB
    const modelRecord = await getModelById(body.model);
    if (!modelRecord) {
      return c.json({ error: "Invalid model" }, 422);
    }

    // Check user has the required API key for this model
    const userId = c.var.user.id;
    const inst = await getInstanceByUserId(userId);
    if (!inst) return c.json({ error: "Instance not found" }, 404);

    const decrypted = await decryptKeys(inst, env.ENCRYPTION_KEY);
    const keyField =
      PROVIDER_TO_KEY[modelRecord.provider as keyof typeof PROVIDER_TO_KEY];
    const hasKey = keyField
      ? !!(decrypted as Record<string, unknown>)[keyField]
      : false;

    if (!hasKey) {
      return c.json({ error: "No API key configured for this model" }, 422);
    }

    // Update DB
    await updateInstance(instanceId, { model: body.model });

    // Update container config + restart
    const agentModelId = toAgentModelId(body.model, modelRecord.provider);

    try {
      await updateOpenclawJson(instanceId, {
        agents: {
          defaults: {
            model: { primary: agentModelId },
          },
        },
      });
      await restartContainer(instanceId);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return c.json(
        { error: "Model saved but container update failed: " + errMsg },
        500,
      );
    }

    return c.json({ success: true, model: body.model });
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
      {
        name: "canvas",
        category: "auto",
        displayName: "Canvas",
        description: "Visual canvas for diagrams and drawings",
        requiresBinary: null,
        requiresCredentials: false,
      },
      {
        name: "coding-agent",
        category: "auto",
        displayName: "Coding Agent",
        description: "AI-powered code generation and editing",
        requiresBinary: null,
        requiresCredentials: false,
      },
      {
        name: "healthcheck",
        category: "auto",
        displayName: "Health Check",
        description: "System health monitoring",
        requiresBinary: null,
        requiresCredentials: false,
      },
      {
        name: "skill-creator",
        category: "auto",
        displayName: "Skill Creator",
        description: "Create custom skills",
        requiresBinary: null,
        requiresCredentials: false,
      },
      {
        name: "notion",
        category: "config",
        displayName: "Notion",
        description: "Notion workspace integration",
        requiresBinary: null,
        requiresCredentials: true,
        credentialFields: ["NOTION_TOKEN"],
        credentialUrl: "https://www.notion.so/profile/integrations",
      },
      {
        name: "slack",
        category: "config",
        displayName: "Slack",
        description: "Slack messaging integration",
        requiresBinary: null,
        requiresCredentials: true,
        credentialFields: ["SLACK_TOKEN"],
        credentialUrl: "https://api.slack.com/apps",
      },
      {
        name: "discord",
        category: "config",
        displayName: "Discord",
        description: "Discord messaging integration",
        requiresBinary: null,
        requiresCredentials: true,
        credentialFields: ["DISCORD_TOKEN"],
        credentialUrl: "https://discord.com/developers/applications",
      },
      {
        name: "github",
        category: "install",
        displayName: "GitHub",
        description: "GitHub repositories and issues",
        requiresBinary: "gh" as const,
        requiresCredentials: true,
        credentialFields: ["GH_TOKEN"],
        credentialUrl: "https://github.com/settings/tokens",
      },
      {
        name: "gog",
        category: "install",
        displayName: "Google Workspace (GoG)",
        description: "Gmail, Calendar, Drive integration",
        requiresBinary: "gog" as const,
        requiresCredentials: true,
        credentialFields: ["oauth"],
        credentialUrl: "https://console.cloud.google.com/apis/credentials",
      },
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
        return c.json(
          { error: `Failed to install ${skillName}: ${result.error}` },
          500,
        );
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

    for (const name of [
      "canvas",
      "coding-agent",
      "healthcheck",
      "skill-creator",
    ]) {
      if (!skillsEntries[name]) {
        skillsEntries[name] = { enabled: true };
      }
    }

    try {
      await updateOpenclawJson(instanceId, {
        skills: { entries: skillsEntries },
      });
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
        return c.json(
          { error: "clientSecret and email are required for step 1" },
          400,
        );
      }

      // Generate or retrieve keyring password
      const existingSkill = (await getSkillsByInstanceId(instanceId)).find(
        (s) => s.skillName === "gog",
      );
      let keyringPassword: string;
      if (
        existingSkill?.config &&
        (existingSkill.config as Record<string, string>).keyringPassword
      ) {
        const stored = (existingSkill.config as Record<string, string>)
          .keyringPassword!;
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
        return c.json(
          { error: `Failed to install gog binary: ${dlResult.error}` },
          500,
        );
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
        const decrypted = await decrypt(
          config.keyringPassword,
          env.ENCRYPTION_KEY,
        );
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
        for (const name of [
          "canvas",
          "coding-agent",
          "healthcheck",
          "skill-creator",
        ]) {
          if (!skillsEntries[name]) {
            skillsEntries[name] = { enabled: true };
          }
        }

        await updateOpenclawJson(instanceId, {
          skills: { entries: skillsEntries },
        });

        await restartContainer(instanceId);

        return c.json({ success: true, account: result.account });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        await upsertSkill(instanceId, "gog", { lastError: errMsg });
        return c.json({ error: `GoG setup step 2 failed: ${errMsg}` }, 500);
      }
    }

    return c.json({ error: "Invalid step. Use 1 or 2." }, 400);
  });
