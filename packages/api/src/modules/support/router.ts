import { Hono } from "hono";
import fs from "node:fs/promises";
import path from "node:path";
import * as z from "zod";

import { and, desc, eq, isNull } from "@workspace/db";
import {
  supportTicket,
  ticketAttachment,
  ticketReply,
} from "@workspace/db/schema";
import { db } from "@workspace/db/server";
import { HttpStatusCode } from "@workspace/shared/constants";
import { HttpException } from "@workspace/shared/utils";

import { enforceAdmin, enforceAuth, validate } from "../../middleware";

import type { User } from "@workspace/auth";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "tickets");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1),
});

const replySchema = z.object({
  message: z.string().min(1),
});

const changeStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "closed"]),
});

async function getTicketAttachments(ticketId: string) {
  return db
    .select()
    .from(ticketAttachment)
    .where(
      and(
        eq(ticketAttachment.ticketId, ticketId),
        isNull(ticketAttachment.replyId),
      ),
    );
}

async function getRepliesWithAttachments(ticketId: string) {
  const replies = await db
    .select()
    .from(ticketReply)
    .where(eq(ticketReply.ticketId, ticketId))
    .orderBy(ticketReply.createdAt);

  return Promise.all(
    replies.map(async (reply) => ({
      ...reply,
      attachments: await db
        .select()
        .from(ticketAttachment)
        .where(eq(ticketAttachment.replyId, reply.id)),
    })),
  );
}

const adminSupportRouter = new Hono<{ Variables: { user: User } }>()
  .use(enforceAdmin)
  .get("/all", async (c) => {
    const tickets = await db
      .select()
      .from(supportTicket)
      .orderBy(desc(supportTicket.createdAt));
    return c.json(tickets);
  })
  .get("/:id", async (c) => {
    const ticketId = c.req.param("id");

    const [ticket] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, ticketId));

    if (!ticket) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const [attachments, replies] = await Promise.all([
      getTicketAttachments(ticketId),
      getRepliesWithAttachments(ticketId),
    ]);

    return c.json({ ...ticket, attachments, replies });
  })
  .post("/:id/reply", validate("json", replySchema), async (c) => {
    const userId = c.var.user.id;
    const ticketId = c.req.param("id");
    const { message } = c.req.valid("json");

    const [ticket] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, ticketId));

    if (!ticket) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const [reply] = await db
      .insert(ticketReply)
      .values({
        id: crypto.randomUUID(),
        ticketId,
        userId,
        message,
        isAdmin: true,
      })
      .returning();

    return c.json(reply, 201);
  })
  .post("/:id/attachments", async (c) => {
    const ticketId = c.req.param("id");

    const [ticket] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, ticketId));

    if (!ticket) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const body = await c.req.parseBody();
    const file = body.file;
    const replyId = body.replyId as string | undefined;

    if (!file || typeof file === "string") {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        code: "error.badRequest",
      });
    }
    if (!file.type.startsWith("image/")) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        code: "error.badRequest",
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        code: "error.badRequest",
      });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const storedName = `${crypto.randomUUID()}.${ext}`;
    const dir = path.join(UPLOAD_DIR, ticketId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, storedName),
      Buffer.from(await file.arrayBuffer()),
    );

    const [attachment] = await db
      .insert(ticketAttachment)
      .values({
        id: crypto.randomUUID(),
        ticketId,
        replyId: replyId ?? null,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storedName,
      })
      .returning();

    return c.json(attachment, 201);
  })
  .put("/:id/status", validate("json", changeStatusSchema), async (c) => {
    const ticketId = c.req.param("id");
    const { status } = c.req.valid("json");

    const [updated] = await db
      .update(supportTicket)
      .set({ status, updatedAt: new Date() })
      .where(eq(supportTicket.id, ticketId))
      .returning();

    if (!updated) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    return c.json(updated);
  });

export const supportRouter = new Hono()
  .use(enforceAuth)
  .post("/", validate("json", createTicketSchema), async (c) => {
    const userId = c.var.user.id;
    const { subject, description } = c.req.valid("json");

    const [ticket] = await db
      .insert(supportTicket)
      .values({ id: crypto.randomUUID(), userId, subject, description })
      .returning();

    return c.json(ticket, 201);
  })
  .get("/", async (c) => {
    const userId = c.var.user.id;

    const tickets = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.userId, userId))
      .orderBy(desc(supportTicket.createdAt));

    return c.json(tickets);
  })
  .route("/admin", adminSupportRouter)
  .get("/attachments/:aid", async (c) => {
    const userId = c.var.user.id;
    const attachmentId = c.req.param("aid");
    const isAdmin = ADMIN_EMAILS.includes(c.var.user.email);

    const [attachment] = await db
      .select()
      .from(ticketAttachment)
      .where(eq(ticketAttachment.id, attachmentId));

    if (!attachment) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    if (!isAdmin) {
      const [ticket] = await db
        .select()
        .from(supportTicket)
        .where(eq(supportTicket.id, attachment.ticketId));
      if (ticket?.userId !== userId) {
        throw new HttpException(HttpStatusCode.NOT_FOUND, {
          code: "error.notFound",
        });
      }
    }

    const filePath = path.join(
      UPLOAD_DIR,
      attachment.ticketId,
      attachment.storedName,
    );

    try {
      const fileBuffer = await fs.readFile(filePath);
      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          "Content-Type": attachment.mimeType,
          "Content-Length": String(attachment.fileSize),
          "Content-Disposition": `inline; filename="${attachment.fileName}"`,
        },
      });
    } catch {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }
  })
  .post("/:id/attachments", async (c) => {
    const userId = c.var.user.id;
    const ticketId = c.req.param("id");

    const [ticket] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, ticketId));

    if (ticket?.userId !== userId) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const body = await c.req.parseBody();
    const file = body.file;
    const replyId = body.replyId as string | undefined;

    if (!file || typeof file === "string") {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        code: "error.badRequest",
      });
    }
    if (!file.type.startsWith("image/")) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        code: "error.badRequest",
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new HttpException(HttpStatusCode.BAD_REQUEST, {
        code: "error.badRequest",
      });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const storedName = `${crypto.randomUUID()}.${ext}`;
    const dir = path.join(UPLOAD_DIR, ticketId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, storedName),
      Buffer.from(await file.arrayBuffer()),
    );

    const [attachment] = await db
      .insert(ticketAttachment)
      .values({
        id: crypto.randomUUID(),
        ticketId,
        replyId: replyId ?? null,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storedName,
      })
      .returning();

    return c.json(attachment, 201);
  })
  .get("/:id", async (c) => {
    const userId = c.var.user.id;
    const ticketId = c.req.param("id");

    const [ticket] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, ticketId));

    if (ticket?.userId !== userId) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const [attachments, replies] = await Promise.all([
      getTicketAttachments(ticketId),
      getRepliesWithAttachments(ticketId),
    ]);

    return c.json({ ...ticket, attachments, replies });
  })
  .post("/:id/reply", validate("json", replySchema), async (c) => {
    const userId = c.var.user.id;
    const ticketId = c.req.param("id");
    const { message } = c.req.valid("json");

    const [ticket] = await db
      .select()
      .from(supportTicket)
      .where(eq(supportTicket.id, ticketId));

    if (ticket?.userId !== userId) {
      throw new HttpException(HttpStatusCode.NOT_FOUND, {
        code: "error.notFound",
      });
    }

    const [reply] = await db
      .insert(ticketReply)
      .values({
        id: crypto.randomUUID(),
        ticketId,
        userId,
        message,
        isAdmin: false,
      })
      .returning();

    return c.json(reply, 201);
  });
