import { Hono } from "hono";
import * as z from "zod";

import { eq } from "@workspace/db";
import { user } from "@workspace/db/schema";
import { db } from "@workspace/db/server";
import { HttpStatusCode } from "@workspace/shared/constants";

import { enforceAuth, validate } from "../../middleware";

const newsletterSchema = z.object({
  optIn: z.boolean(),
});

export const userRouter = new Hono()
  .use(enforceAuth)
  .get("/newsletter", async (c) => {
    const currentUser = c.var.user;

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, currentUser.id),
      columns: { newsletterOptIn: true },
    });

    return c.json({ optIn: dbUser?.newsletterOptIn ?? false });
  })
  .put("/newsletter", validate("json", newsletterSchema), async (c) => {
    const currentUser = c.var.user;
    const { optIn } = c.req.valid("json");

    await db
      .update(user)
      .set({ newsletterOptIn: optIn })
      .where(eq(user.id, currentUser.id));

    return c.json({ success: true, optIn }, HttpStatusCode.OK);
  });
