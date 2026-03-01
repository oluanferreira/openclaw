import { eq } from "@workspace/db";
import { vpsServer } from "@workspace/db/schema";
import { db } from "@workspace/db/server";

export interface VpsServer {
  id: string;
  name: string;
  location: string;
  endpoint: string;
  token?: string;
}

const DEFAULT_SERVERS: VpsServer[] = [
  {
    id: "vps-main",
    name: "VPS Principal",
    location: "São Paulo",
    endpoint: "local",
  },
];

export async function seedVpsServers() {
  for (const server of DEFAULT_SERVERS) {
    await db
      .insert(vpsServer)
      .values({
        id: server.id,
        name: server.name,
        location: server.location,
        endpoint: server.endpoint,
        token: server.token ?? "",
      })
      .onConflictDoNothing({ target: vpsServer.id });
  }
}

export const getVpsById = async (id: string) => {
  const [result] = await db
    .select()
    .from(vpsServer)
    .where(eq(vpsServer.id, id))
    .limit(1);
  return result ?? null;
};

export const getActiveVpsServers = async () => {
  return db.select().from(vpsServer).where(eq(vpsServer.isActive, true));
};

export const getDefaultVpsId = () => "vps-main";
