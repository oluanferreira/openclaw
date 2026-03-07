import { eq, and } from "@workspace/db";
import { instanceSkill } from "@workspace/db/schema";
import { db } from "@workspace/db/server";

import type { InsertInstanceSkill } from "@workspace/db/schema";

export const getSkillsByInstanceId = async (instanceId: string) =>
  db
    .select()
    .from(instanceSkill)
    .where(eq(instanceSkill.instanceId, instanceId));

export const getSkill = async (instanceId: string, skillName: string) =>
  db
    .select()
    .from(instanceSkill)
    .where(
      and(
        eq(instanceSkill.instanceId, instanceId),
        eq(instanceSkill.skillName, skillName),
      ),
    )
    .then((entries) => entries[0] ?? null);

export const upsertSkill = async (
  instanceId: string,
  skillName: string,
  data: Partial<Omit<InsertInstanceSkill, "instanceId" | "skillName">>,
) => {
  const existing = await getSkill(instanceId, skillName);

  if (existing) {
    return db
      .update(instanceSkill)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(instanceSkill.instanceId, instanceId),
          eq(instanceSkill.skillName, skillName),
        ),
      )
      .returning()
      .then((r) => r[0]);
  }

  return db
    .insert(instanceSkill)
    .values({ instanceId, skillName, ...data })
    .returning()
    .then((r) => r[0]);
};
