import { execSync } from "child_process";

import { getActiveVpsServers, getDefaultVpsId } from "./vps-config";

interface ServerStats {
  cpuPercent: number;
  memPercent: number;
}

const collectLocalStats = (): ServerStats | null => {
  try {
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
    const memPercent =
      memTotal > 0 ? Math.round((memUsed / memTotal) * 10000) / 100 : 0;

    const cpuCores = parseInt(exec("nproc") || "1", 10);
    const loadAvg = exec("cat /proc/loadavg").split(" ");
    const load1 = parseFloat(loadAvg[0] ?? "0");
    const cpuPercent = Math.min(
      Math.round((load1 / cpuCores) * 100 * 100) / 100,
      100,
    );

    return { cpuPercent, memPercent };
  } catch {
    return null;
  }
};

const collectRemoteStats = async (
  endpoint: string,
  token: string,
): Promise<ServerStats | null> => {
  try {
    const res = await fetch(`${endpoint}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      server?: { cpuPercent?: number; memPercent?: number };
    };
    return {
      cpuPercent: data.server?.cpuPercent ?? 100,
      memPercent: data.server?.memPercent ?? 100,
    };
  } catch {
    return null;
  }
};

const calculateScore = (stats: ServerStats): number =>
  (stats.cpuPercent + stats.memPercent) / 2;

export async function selectBestVps(): Promise<string> {
  const servers = await getActiveVpsServers();

  if (servers.length === 0) {
    return getDefaultVpsId();
  }

  const results = await Promise.all(
    servers.map(async (vps) => {
      let stats: ServerStats | null;

      if (vps.endpoint === "local") {
        stats = collectLocalStats();
      } else {
        stats = await collectRemoteStats(vps.endpoint, vps.token ?? "");
      }

      return { vps, stats };
    }),
  );

  const online = results.filter(
    (r): r is { vps: (typeof servers)[number]; stats: ServerStats } =>
      r.stats !== null,
  );

  if (online.length === 0) {
    return getDefaultVpsId();
  }

  online.sort((a, b) => calculateScore(a.stats) - calculateScore(b.stats));

  return online[0]!.vps.id;
}
