import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import Stripe from "stripe";
import * as z from "zod";

import { eq } from "@workspace/db";
import { user, instance, subscription, vpsServer } from "@workspace/db/schema";
import { db } from "@workspace/db/server";
import {
  ManageInstanceAction,
  manageInstanceSchema,
} from "@workspace/openclaw";
import {
  getStatus,
  manage,
  deleteInstance,
  getUrl,
} from "@workspace/openclaw/server";
import { HttpStatusCode } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

import { env } from "../../env";
import { enforceAuth, validate } from "../../middleware";

const createServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  location: z.string().min(1),
  endpoint: z.string().optional().default("local"),
  token: z.string().optional().default(""),
});

const updateServerSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  endpoint: z.string().optional(),
  token: z.string().optional(),
  isActive: z.boolean().optional(),
});

import type { User } from "@workspace/auth";

const ADMIN_EMAILS = ["luanferreira.emp@gmail.com", "luizjuniorbjj@gmail.com"];

let _stripe: Stripe | null = null;
const getStripe = () => {
  if (!_stripe) _stripe = new Stripe(env.STRIPE_SECRET_KEY);
  return _stripe;
};

const enforceAdmin = createMiddleware<{
  Variables: {
    user: User;
  };
}>(async (c, next) => {
  if (!ADMIN_EMAILS.includes(c.var.user.email)) {
    throw new HttpException(HttpStatusCode.FORBIDDEN, {
      code: "error.forbidden",
    });
  }
  await next();
});

const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthLabel = (key: string) => {
  const [year, month] = key.split("-");
  const labels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return labels[parseInt(month!, 10) - 1]!;
};

export const adminRouter = new Hono()
  .use(enforceAuth)
  .use(enforceAdmin)

  // ─── SERVERS CRUD ─────────────────────────────────────────────────────

  .get("/servers", async (c) => {
    const servers = await db.select().from(vpsServer);
    return c.json(servers);
  })

  .post("/servers", validate("json", createServerSchema), async (c) => {
    const body = c.req.valid("json");

    const existing = await db
      .select()
      .from(vpsServer)
      .where(eq(vpsServer.id, body.id))
      .then((r) => r[0]);

    if (existing) {
      throw new HttpException(HttpStatusCode.CONFLICT, {
        code: "error.serverAlreadyExists",
      });
    }

    const [created] = await db
      .insert(vpsServer)
      .values({
        id: body.id,
        name: body.name,
        location: body.location,
        endpoint: body.endpoint ?? "local",
        token: body.token ?? "",
      })
      .returning();

    return c.json(created, HttpStatusCode.CREATED);
  })

  .put("/servers/:id", validate("json", updateServerSchema), async (c) => {
    const serverId = c.req.param("id");
    const body = c.req.valid("json");

    const existing = await db
      .select()
      .from(vpsServer)
      .where(eq(vpsServer.id, serverId))
      .then((r) => r[0]);

    if (!existing) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.serverNotFound",
      });
    }

    const [updated] = await db
      .update(vpsServer)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.endpoint !== undefined && { endpoint: body.endpoint }),
        ...(body.token !== undefined && { token: body.token }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(vpsServer.id, serverId))
      .returning();

    return c.json(updated);
  })

  .delete("/servers/:id", async (c) => {
    const serverId = c.req.param("id");

    // Bloqueia remoção da VPS principal
    if (serverId === "vps-main") {
      throw new HttpException(HttpStatusCode.FORBIDDEN, {
        code: "error.cannotDeleteMainServer",
      });
    }

    const existing = await db
      .select()
      .from(vpsServer)
      .where(eq(vpsServer.id, serverId))
      .then((r) => r[0]);

    if (!existing) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.serverNotFound",
      });
    }

    await db.delete(vpsServer).where(eq(vpsServer.id, serverId));

    return c.json({ success: true });
  })

  // ─── USERS ────────────────────────────────────────────────────────────

  .get("/users", async (c) => {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        instance: {
          id: instance.id,
          model: instance.model,
          communicationChannel: instance.communicationChannel,
          createdAt: instance.createdAt,
        },
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      })
      .from(user)
      .leftJoin(instance, eq(user.id, instance.userId))
      .leftJoin(subscription, eq(user.id, subscription.userId));

    return c.json(users);
  })
  .get("/instances", async (c) => {
    const instances = await db
      .select({
        id: instance.id,
        userId: instance.userId,
        model: instance.model,
        communicationChannel: instance.communicationChannel,
        token: instance.token,
        vpsId: instance.vpsId,
        createdAt: instance.createdAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(instance)
      .leftJoin(user, eq(instance.userId, user.id));

    const withStatus = await Promise.all(
      instances.map(async (inst) => {
        try {
          const status = await getStatus(inst.id);
          const url = getUrl(inst.id, inst.token);
          return { ...inst, status, url };
        } catch {
          return { ...inst, status: null, url: null };
        }
      }),
    );

    return c.json(withStatus);
  })
  .post(
    "/instances/:id/manage",
    validate("json", manageInstanceSchema),
    async (c) => {
      const instanceId = c.req.param("id");
      const { action } = c.req.valid("json");

      const result = await manage(instanceId, action);

      if (action === ManageInstanceAction.DESTROY) {
        await deleteInstance(instanceId);
      }

      return c.json(result);
    },
  )
  .delete("/users/:id", async (c) => {
    const userId = c.req.param("id");

    const target = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .then((r) => r[0]);

    if (!target) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const userInstance = await db
      .select()
      .from(instance)
      .where(eq(instance.userId, userId))
      .then((r) => r[0]);

    if (userInstance) {
      try {
        await manage(userInstance.id, ManageInstanceAction.DESTROY);
      } catch {
        // instance container may already be gone
      }
      await deleteInstance(userInstance.id);
    }

    await db.delete(user).where(eq(user.id, userId));

    return c.json({ success: true });
  })

  // ─── SUBSCRIPTIONS ────────────────────────────────────────────────────

  .get("/subscriptions", async (c) => {
    const subs = await db
      .select({
        id: subscription.id,
        userId: subscription.userId,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        stripePriceId: subscription.stripePriceId,
        currentPeriodEnd: subscription.currentPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(subscription)
      .leftJoin(user, eq(subscription.userId, user.id));

    return c.json(subs);
  })
  .get("/subscriptions/stats", async (c) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysFromNow = new Date(
      now.getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const allSubs = await db.select().from(subscription);

    const active = allSubs.filter((s) => s.status === "active");
    const inactive = allSubs.filter((s) => s.status === "inactive");
    const canceled = allSubs.filter((s) => s.status === "canceled");
    const pastDue = allSubs.filter((s) => s.status === "past_due");

    const expiringIn7Days = active.filter(
      (s) => s.currentPeriodEnd && s.currentPeriodEnd <= sevenDaysFromNow,
    );
    const expiringIn30Days = active.filter(
      (s) => s.currentPeriodEnd && s.currentPeriodEnd <= thirtyDaysFromNow,
    );

    const recentChurn = allSubs.filter(
      (s) =>
        (s.status === "canceled" || s.status === "inactive") &&
        s.updatedAt >= thirtyDaysAgo,
    );

    const PRICE_USD = 29.9;
    const mrr = active.length * PRICE_USD;

    return c.json({
      total: allSubs.length,
      active: active.length,
      inactive: inactive.length,
      canceled: canceled.length,
      pastDue: pastDue.length,
      expiringIn7Days: expiringIn7Days.length,
      expiringIn30Days: expiringIn30Days.length,
      recentChurn: recentChurn.length,
      mrr,
    });
  })
  .get("/subscriptions/:customerId/invoices", async (c) => {
    const customerId = c.req.param("customerId");

    try {
      const invoices = await getStripe().invoices.list({
        customer: customerId,
        limit: 50,
      });

      const mapped = invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amountDue: inv.amount_due,
        amountPaid: inv.amount_paid,
        currency: inv.currency,
        created: inv.created,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        hostedInvoiceUrl: inv.hosted_invoice_url,
        invoicePdf: inv.invoice_pdf,
      }));

      return c.json(mapped);
    } catch {
      return c.json([]);
    }
  })

  // ─── STATS ────────────────────────────────────────────────────────────

  .get("/stats/growth", async (c) => {
    const now = new Date();

    // Last 7 months
    const months: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(getMonthKey(d));
    }

    // Last 7 days
    const getDayKey = (date: Date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };
    const getDayLabel = (key: string) => {
      const parts = key.split("-");
      return `${parts[2]}/${parts[1]}`;
    };
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(getDayKey(d));
    }

    const allUsers = await db
      .select({ createdAt: user.createdAt })
      .from(user);
    const allInstances = await db
      .select({ createdAt: instance.createdAt })
      .from(instance);
    const allSubs = await db
      .select({ createdAt: subscription.createdAt, status: subscription.status })
      .from(subscription);

    const usersByMonth = months.map((month) => {
      const count = allUsers.filter(
        (u) => getMonthKey(u.createdAt) === month,
      ).length;
      return { month, label: getMonthLabel(month), count };
    });

    const usersByDay = days.map((day) => {
      const count = allUsers.filter(
        (u) => getDayKey(u.createdAt) === day,
      ).length;
      return { month: day, label: getDayLabel(day), count };
    });

    // Instance breakdown by model
    const allInstancesFull = await db
      .select({ model: instance.model })
      .from(instance);
    const modelBreakdown: Record<string, number> = {};
    for (const inst of allInstancesFull) {
      modelBreakdown[inst.model] = (modelBreakdown[inst.model] ?? 0) + 1;
    }

    // Channel breakdown
    const allInstancesChannel = await db
      .select({ communicationChannel: instance.communicationChannel })
      .from(instance);
    const channelBreakdown: Record<string, number> = {};
    for (const inst of allInstancesChannel) {
      channelBreakdown[inst.communicationChannel] =
        (channelBreakdown[inst.communicationChannel] ?? 0) + 1;
    }

    return c.json({
      usersByMonth,
      usersByDay,
      modelBreakdown,
      channelBreakdown,
      totalUsers: allUsers.length,
      totalInstances: allInstancesFull.length,
      totalSubs: allSubs.length,
      activeSubs: allSubs.filter((s) => s.status === "active").length,
    });
  })
  .get("/stats/servers", async (c) => {
    // Consulta banco em vez de array hardcodado
    const servers = await db
      .select()
      .from(vpsServer)
      .where(eq(vpsServer.isActive, true));

    const collectLocalStats = async () => {
      const { execSync } = await import("child_process");

      const exec = (cmd: string) => {
        try {
          return execSync(cmd, { timeout: 5000 }).toString().trim();
        } catch {
          return "";
        }
      };

      const memRaw = exec("free -b");
      const memLines = memRaw.split("\n");
      const memParts = memLines[1]?.split(/\s+/) ?? [];
      const memTotal = parseInt(memParts[1] ?? "0", 10);
      const memUsed = parseInt(memParts[2] ?? "0", 10);

      const diskRaw = exec("df -B1 / | tail -1");
      const diskParts = diskRaw.split(/\s+/);
      const diskTotal = parseInt(diskParts[1] ?? "0", 10);
      const diskUsed = parseInt(diskParts[2] ?? "0", 10);

      const cpuCores = parseInt(exec("nproc") || "1", 10);
      const loadAvg = exec("cat /proc/loadavg").split(" ");
      const load1 = parseFloat(loadAvg[0] ?? "0");
      const cpuPercent = Math.min((load1 / cpuCores) * 100, 100);

      const uptimeRaw = exec("cat /proc/uptime");
      const uptimeSeconds = parseFloat(uptimeRaw.split(" ")[0] ?? "0");

      const dockerRaw = exec("docker stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.PIDs}}'");
      const containers = dockerRaw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const [name, cpu, mem, memPerc, net, pids] = line.split("|");
          return {
            name: name ?? "",
            cpu: cpu ?? "0%",
            mem: mem ?? "0B / 0B",
            memPercent: memPerc ?? "0%",
            net: net ?? "0B / 0B",
            pids: pids ?? "0",
          };
        })
        .filter((ct) => ct.name !== "openclaw-db-1");

      return {
        server: {
          cpuCores,
          cpuPercent: Math.round(cpuPercent * 100) / 100,
          memTotal,
          memUsed,
          memPercent: memTotal > 0 ? Math.round((memUsed / memTotal) * 10000) / 100 : 0,
          diskTotal,
          diskUsed,
          diskPercent: diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 10000) / 100 : 0,
          uptimeSeconds,
        },
        containers,
      };
    };

    const collectRemoteStats = async (endpoint: string, token: string) => {
      try {
        const res = await fetch(`${endpoint}/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    };

    const results = await Promise.all(
      servers.map(async (vps) => {
        if (vps.endpoint === "local") {
          const stats = await collectLocalStats();
          return { id: vps.id, name: vps.name, location: vps.location, online: true, ...stats };
        }
        const stats = await collectRemoteStats(vps.endpoint, vps.token ?? "");
        if (!stats) {
          return { id: vps.id, name: vps.name, location: vps.location, online: false, server: null, containers: [] };
        }
        return { id: vps.id, name: vps.name, location: vps.location, online: true, ...stats };
      }),
    );

    return c.json(results);
  })


  // --- UPTIME (UptimeRobot) -----------------------------------------------

  .get("/stats/uptime", async (c) => {
    const apiKey = env.UPTIMEROBOT_API_KEY;
    if (!apiKey) {
      return c.json({ monitors: [], error: "UPTIMEROBOT_API_KEY not configured" });
    }

    try {
      const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          api_key: apiKey,
          format: "json",
          response_times: "1",
          response_times_limit: "1",
          all_time_uptime_ratio: "1",
        }).toString(),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return c.json({ monitors: [], error: "UptimeRobot API error" });
      }

      const data = (await res.json()) as {
        stat: string;
        monitors?: Array<{
          id: number;
          friendly_name: string;
          url: string;
          status: number;
          all_time_uptime_ratio: string;
          response_times?: Array<{ value: number }>;
        }>;
      };

      if (data.stat !== "ok" || !data.monitors) {
        return c.json({ monitors: [], error: "UptimeRobot returned error" });
      }

      const monitors = data.monitors.map((m) => ({
        id: m.id,
        name: m.friendly_name,
        url: m.url,
        status: m.status,
        uptimeRatio: parseFloat(m.all_time_uptime_ratio ?? "0"),
        responseTime: m.response_times?.[0]?.value ?? null,
      }));

      return c.json({ monitors });
    } catch {
      return c.json({ monitors: [], error: "Failed to reach UptimeRobot" });
    }
  });
