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
} from "@workspace/openclaw/server";

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

const maskKey = (key: string | null | undefined): string => {
  if (!key || key.length < 8) return "";
  return `${key.slice(0, 7)}...${key.slice(-4)}`;
};

/**
 * Routes updateKeys to the correct VPS (local via SSH or remote via HTTP agent).
 */
const routeUpdateKeys = async (
  instanceId: string,
  vpsId: string,
  aiKeys: AiKeysInput,
) => {
  const vps = await getVpsById(vpsId);

  if (!vps || vps.endpoint === "local") {
    return updateKeys(instanceId, aiKeys);
  }

  // Remote VPS — delegate to agent HTTP
  const res = await fetch(`${vps.endpoint}/update-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${vps.token ?? ""}`,
    },
    body: JSON.stringify({ instanceId, aiKeys }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const error = await res.text().catch(() => "Unknown error");
    throw new Error(`Remote updateKeys failed on ${vps.name}: ${error}`);
  }

  return res.json();
};

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

      await createInstance({
        userId,
        communicationChannel: payload.communication.channel,
        vpsId,
        openaiApiKey: payload.aiKeys?.openaiApiKey || null,
        anthropicApiKey: payload.aiKeys?.anthropicApiKey || null,
        googleApiKey: payload.aiKeys?.googleApiKey || null,
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
  .get("/status", enforceInstance, async (c) =>
    c.json(await getStatus(c.var.instanceId)),
  )
  .get("/logs", enforceInstance, async (c) =>
    c.json(await getLogs(c.var.instanceId)),
  )
  .get("/pairing", enforceInstance, async (c) =>
    c.json(await getPairingRequests(c.var.instanceId)),
  )
  .get("/keys", enforceInstance, async (c) => {
    const userId = c.var.user.id;
    const inst = await getInstanceByUserId(userId);

    if (!inst) {
      return c.json(null, 404);
    }

    return c.json({
      openaiApiKey: maskKey(inst.openaiApiKey),
      anthropicApiKey: maskKey(inst.anthropicApiKey),
      googleApiKey: maskKey(inst.googleApiKey),
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

    // Only update keys that were actually provided (non-empty)
    const newKeys = {
      openaiApiKey: payload.openaiApiKey || inst.openaiApiKey,
      anthropicApiKey: payload.anthropicApiKey || inst.anthropicApiKey,
      googleApiKey: payload.googleApiKey || inst.googleApiKey,
    };

    // Update in DB
    await updateInstance(instanceId, newKeys);

    // Recreate Docker container on the correct VPS with new env vars
    await routeUpdateKeys(instanceId, inst.vpsId, {
      openaiApiKey: newKeys.openaiApiKey ?? undefined,
      anthropicApiKey: newKeys.anthropicApiKey ?? undefined,
      googleApiKey: newKeys.googleApiKey ?? undefined,
    });

    return c.json({
      openaiApiKey: maskKey(newKeys.openaiApiKey),
      anthropicApiKey: maskKey(newKeys.anthropicApiKey),
      googleApiKey: maskKey(newKeys.googleApiKey),
    });
  })
  .post(
    "/manage",
    enforceInstance,
    validate("json", manageInstanceSchema),
    async (c) => {
      const instanceId = c.var.instanceId;
      const payload = c.req.valid("json");

      const result = await manage(instanceId, payload.action);

      if (payload.action === ManageInstanceAction.DESTROY) {
        await deleteInstance(instanceId);
      }

      return c.json(result);
    },
  )
  .post("/cli", enforceInstance, validate("json", commandSchema), async (c) => {
    const instanceId = c.var.instanceId;
    const payload = c.req.valid("json");

    const command = getCommandToRun(payload);

    return c.json(await cli(instanceId, command));
  });
