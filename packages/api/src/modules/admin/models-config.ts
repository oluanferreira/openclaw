import { asc, eq } from "@workspace/db";
import { aiModel } from "@workspace/db/schema";
import { db } from "@workspace/db/server";
import { MODELS } from "@workspace/openclaw/config";
import { logger } from "@workspace/shared/logger";

export async function seedAiModels() {
  const rows = MODELS.map((m, i) => ({
    id: m.id,
    provider: m.provider,
    name: m.name,
    tier: "flagship" as const,
    sortOrder: i,
    isActive: true,
  }));

  await db.insert(aiModel).values(rows).onConflictDoNothing();
  logger.info(`Seeded ${rows.length} AI models (onConflictDoNothing)`);
}

export async function getActiveModels() {
  return db
    .select()
    .from(aiModel)
    .where(eq(aiModel.isActive, true))
    .orderBy(asc(aiModel.sortOrder));
}

export async function getAllModels() {
  return db.select().from(aiModel).orderBy(asc(aiModel.sortOrder));
}

export async function getModelById(id: string) {
  const [model] = await db.select().from(aiModel).where(eq(aiModel.id, id));
  return model ?? null;
}
