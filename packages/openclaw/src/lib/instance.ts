import { eq } from "@workspace/db";
import { instance } from "@workspace/db/schema";
import { db } from "@workspace/db/server";

import type { InsertInstance } from "@workspace/db/schema";

export const createInstance = async (data: InsertInstance) =>
  db.insert(instance).values(data).returning();

export const getInstanceById = async (id: string) =>
  db
    .select()
    .from(instance)
    .where(eq(instance.id, id))
    .then((entries) => entries[0] ?? null);

export const getInstanceByUserId = async (userId: string) =>
  db
    .select()
    .from(instance)
    .where(eq(instance.userId, userId))
    .then((entries) => entries[0] ?? null);

export const deleteInstance = async (id: string) =>
  db.delete(instance).where(eq(instance.id, id));
