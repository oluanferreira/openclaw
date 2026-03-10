"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { handle } from "@workspace/api/utils";
import { useTranslation } from "@workspace/i18n";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui-web/dialog";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Label } from "@workspace/ui-web/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui-web/sheet";
import { Skeleton } from "@workspace/ui-web/skeleton";
import { Spinner } from "@workspace/ui-web/spinner";
import { Textarea } from "@workspace/ui-web/textarea";

import { api } from "~/lib/api/client";
import {
  DashboardHeader,
  DashboardHeaderDescription,
  DashboardHeaderTitle,
} from "~/modules/common/layout/dashboard/header";

import { support } from "../lib/api";

interface TicketAttachment {
  id: string;
  ticketId: string;
  replyId: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  storedName: string;
  createdAt: string | Date;
}

const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
  open: "success",
  in_progress: "warning",
  closed: "secondary",
};

export const SupportView = () => {
  const { t } = useTranslation(["common", "dashboard"]);
  const queryClient = useQueryClient();
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [replyMessage, setReplyMessage] = useState("");

  // File state for dialog (ticket creation)
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const attachFileRef = useRef<HTMLInputElement>(null);

  // File state for reply in sheet
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const tString = t as unknown as (key: string) => string;
  const tickets = useQuery(support.queries.list);
  const ticketDetail = useQuery({
    ...support.queries.detail(selectedTicketId ?? ""),
    enabled: !!selectedTicketId,
  });

  const uploadAttachment = useMutation({
    ...support.mutations.uploadAttachment(selectedTicketId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["support", "detail", selectedTicketId],
      });
    },
  });

  const createTicket = useMutation({
    ...support.mutations.create,
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["support", "list"] });
      if (attachFile && data.id) {
        await fetch(`/api/support/${data.id}/attachments`, {
          method: "POST",
          credentials: "include",
          body: (() => {
            const form = new FormData();
            form.append("file", attachFile);
            return form;
          })(),
        });
      }
      setSubject("");
      setDescription("");
      setAttachFile(null);
      setOpenCreate(false);
    },
  });

  const replyToTicket = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!selectedTicketId) return;
      return handle(api.support[":id"].reply.$post)({
        param: { id: selectedTicketId },
        json: data,
      });
    },
    onSuccess: async (data) => {
      if (replyFile && selectedTicketId && data?.id) {
        await uploadAttachment.mutateAsync({
          file: replyFile,
          replyId: data.id,
        });
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["support", "detail", selectedTicketId],
        });
      }
      setReplyMessage("");
      setReplyFile(null);
    },
  });

  const attachments = (
    ticketDetail.data as { attachments?: TicketAttachment[] } | undefined
  )?.attachments;

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>
            {t("dashboard:support.home.title")}
          </DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("dashboard:support.home.description")}
          </DashboardHeaderDescription>
        </div>

        <Button onClick={() => setOpenCreate(true)}>
          <Icons.Plus />
          {t("dashboard:support.ticket.new")}
        </Button>
      </DashboardHeader>

      <div className="flex w-full flex-col gap-3">
        {tickets.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : !tickets.data?.length ? (
          <div className="text-muted-foreground flex w-full flex-col items-center justify-center py-16 text-sm">
            <Icons.LifeBuoy className="mb-3 size-10 opacity-30" />
            <p>{t("dashboard:support.ticket.empty")}</p>
          </div>
        ) : (
          (
            tickets.data as {
              id: string;
              subject: string;
              description: string;
              status: string;
              createdAt: string | Date;
            }[]
          ).map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicketId(ticket.id)}
              t={tString}
            />
          ))
        )}
      </div>

      {/* Dialog: novo ticket */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard:support.ticket.newTitle")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="subject">
                {t("dashboard:support.ticket.form.subject")}
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={t(
                  "dashboard:support.ticket.form.subjectPlaceholder",
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">
                {t("dashboard:support.ticket.form.description")}
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t(
                  "dashboard:support.ticket.form.descriptionPlaceholder",
                )}
                rows={4}
              />
              {/* Botão de anexar imagem */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-8 gap-1.5 px-2"
                  onClick={() => attachFileRef.current?.click()}
                >
                  <Icons.Paperclip className="size-4" />
                  <span className="text-xs">{"Attach image"}</span>
                </Button>
                <input
                  ref={attachFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
                />
                {attachFile && (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={URL.createObjectURL(attachFile)}
                      alt={attachFile.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                    <span className="text-muted-foreground max-w-[120px] truncate text-xs">
                      {attachFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachFile(null);
                        if (attachFileRef.current)
                          attachFileRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Icons.X className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              {t("cancel")}
            </Button>
            <Button
              onClick={() => createTicket.mutate({ subject, description })}
              disabled={
                !subject.trim() || !description.trim() || createTicket.isPending
              }
            >
              {createTicket.isPending && <Spinner />}
              {t("dashboard:support.ticket.form.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sheet: detalhe do ticket */}
      <Sheet
        open={!!selectedTicketId}
        onOpenChange={(open) => !open && setSelectedTicketId(null)}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-lg"
        >
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-xl">
              {ticketDetail.data?.subject ??
                t("dashboard:support.ticket.details")}
            </SheetTitle>
            {ticketDetail.data && (
              <Badge
                variant={statusVariant[ticketDetail.data.status] ?? "secondary"}
                className="w-fit"
              >
                {t(
                  `dashboard:support.ticket.status.${ticketDetail.data.status}`,
                )}
              </Badge>
            )}
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            {ticketDetail.isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="mb-1 text-sm font-medium">
                    {ticketDetail.data?.subject}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {ticketDetail.data?.description}
                  </p>
                  {/* Imagens do ticket */}
                  {attachments && attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`/api/support/attachments/${att.id}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={`/api/support/attachments/${att.id}`}
                            alt={att.fileName}
                            className="max-h-48 w-auto cursor-pointer rounded-md border"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <span className="text-muted-foreground text-xs uppercase">
                  {t("dashboard:support.ticket.replies")}
                </span>

                {!(ticketDetail.data as { replies?: unknown[] } | undefined)
                  ?.replies?.length ? (
                  <p className="text-muted-foreground text-sm">
                    {t("dashboard:support.ticket.noReplies")}
                  </p>
                ) : (
                  (
                    (ticketDetail.data as { replies: unknown[] }).replies as {
                      id: string;
                      message: string;
                      isAdmin: boolean;
                      createdAt: string | Date;
                      attachments?: TicketAttachment[];
                    }[]
                  ).map((reply) => (
                    <div
                      key={reply.id}
                      className={`rounded-md p-3 text-sm ${
                        reply.isAdmin
                          ? "border-primary/20 bg-primary/10 border"
                          : "bg-muted/50"
                      }`}
                    >
                      <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                        {reply.isAdmin ? tString("admin") : tString("you")}
                      </p>
                      <p>{reply.message}</p>
                      {reply.attachments && reply.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {reply.attachments.map((att) => (
                            <a
                              key={att.id}
                              href={`/api/support/attachments/${att.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={`/api/support/attachments/${att.id}`}
                                alt={att.fileName}
                                className="max-h-48 w-auto cursor-pointer rounded-md border"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </>
            )}
          </div>

          {ticketDetail.data?.status !== "closed" && (
            <div className="flex flex-col gap-2 border-t p-4">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={t("dashboard:support.ticket.reply.placeholder")}
                rows={3}
              />
              {/* Anexo para reply */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-8 gap-1.5 px-2"
                  onClick={() => replyFileRef.current?.click()}
                >
                  <Icons.Paperclip className="size-4" />
                  <span className="text-xs">{"Attach image"}</span>
                </Button>
                <input
                  ref={replyFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setReplyFile(e.target.files?.[0] ?? null)}
                />
                {replyFile && (
                  <div className="flex items-center gap-1.5">
                    <img
                      src={URL.createObjectURL(replyFile)}
                      alt={replyFile.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                    <span className="text-muted-foreground max-w-[120px] truncate text-xs">
                      {replyFile.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyFile(null);
                        if (replyFileRef.current)
                          replyFileRef.current.value = "";
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Icons.X className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <Button
                className="self-end"
                size="sm"
                onClick={() => replyToTicket.mutate({ message: replyMessage })}
                disabled={!replyMessage.trim() || replyToTicket.isPending}
              >
                {replyToTicket.isPending && <Spinner />}
                {t("dashboard:support.ticket.reply.submit")}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

const TicketRow = ({
  ticket,
  onClick,
  t,
}: {
  ticket: {
    id: string;
    subject: string;
    description: string;
    status: string;
    createdAt: string | Date;
  };
  onClick: () => void;
  t: (key: string) => string;
}) => (
  <button
    onClick={onClick}
    className="bg-card border-border hover:bg-accent w-full rounded-lg border p-4 text-left transition-colors"
  >
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{ticket.subject}</p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {ticket.description}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <Badge
          variant={statusVariant[ticket.status] ?? "secondary"}
          className="text-xs"
        >
          {t(`dashboard:support.ticket.status.${ticket.status}`)}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  </button>
);
