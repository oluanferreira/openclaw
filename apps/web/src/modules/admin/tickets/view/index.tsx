"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";


import { handle } from "@workspace/api/utils";
import { useTranslation } from "@workspace/i18n";
import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import { Icons } from "@workspace/ui-web/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui-web/select";
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



import { adminSupport } from "../lib/api";

type TicketStatus = "open" | "in_progress" | "closed";
type StatusFilter = "all" | TicketStatus;

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

const statusVariant: Record<TicketStatus, "success" | "warning" | "secondary"> =
  {
    open: "success",
    in_progress: "warning",
    closed: "secondary",
  };

export const AdminTicketsView = () => {
  const { t } = useTranslation(["common", "dashboard"]);
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [replyMessage, setReplyMessage] = useState("");

  // File state for admin reply
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const replyFileRef = useRef<HTMLInputElement>(null);

  const tickets = useQuery(adminSupport.queries.list);
  const ticketDetail = useQuery({
    ...adminSupport.queries.detail(selectedTicketId ?? ""),
    enabled: !!selectedTicketId,
  });

  const uploadAttachment = useMutation({
    ...adminSupport.mutations.uploadAttachment(selectedTicketId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-support", "detail", selectedTicketId],
      });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!selectedTicketId) return;
      return handle(api.support.admin[":id"].reply.$post)({
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
          queryKey: ["admin-support", "detail", selectedTicketId],
        });
      }
      setReplyMessage("");
      setReplyFile(null);
    },
  });

  const changeStatus = useMutation({
    mutationFn: async (data: { status: TicketStatus }) => {
      if (!selectedTicketId) return;
      return handle(api.support.admin[":id"].status.$put)({
        param: { id: selectedTicketId },
        json: data,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-support"] });
    },
  });

  const filteredTickets =
    statusFilter === "all"
      ? tickets.data
      : tickets.data?.filter((ticket) => ticket.status === statusFilter);

  const ticketAttachments = (ticketDetail.data as any)?.attachments as
    | TicketAttachment[]
    | undefined;

  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>
            {t("dashboard:admin.tickets.home.title")}
          </DashboardHeaderTitle>
          <DashboardHeaderDescription>
            {t("dashboard:admin.tickets.home.description")}
          </DashboardHeaderDescription>
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v!)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="open">
              {t("dashboard:support.ticket.status.open")}
            </SelectItem>
            <SelectItem value="in_progress">
              {t("dashboard:support.ticket.status.in_progress")}
            </SelectItem>
            <SelectItem value="closed">
              {t("dashboard:support.ticket.status.closed")}
            </SelectItem>
          </SelectContent>
        </Select>
      </DashboardHeader>

      <div className="flex w-full flex-col gap-3">
        {tickets.isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))
        ) : !filteredTickets?.length ? (
          <div className="text-muted-foreground flex w-full flex-col items-center justify-center py-16 text-sm">
            <Icons.LifeBuoy className="mb-3 size-10 opacity-30" />
            <p>{t("dashboard:admin.tickets.empty")}</p>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className="bg-card border-border hover:bg-accent w-full rounded-lg border p-4 text-left transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {ticket.subject}
                  </p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {ticket.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge
                    variant={
                      statusVariant[ticket.status as TicketStatus] ??
                      "secondary"
                    }
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
          ))
        )}
      </div>

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
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    statusVariant[ticketDetail.data.status as TicketStatus] ??
                    "secondary"
                  }
                >
                  {t(
                    `dashboard:support.ticket.status.${ticketDetail.data.status}`,
                  )}
                </Badge>

                <Select
                  value={ticketDetail.data.status}
                  onValueChange={(v) =>
                    changeStatus.mutate({ status: v! })
                  }
                >
                  <SelectTrigger className="h-7 w-36 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      {t("dashboard:support.ticket.status.open")}
                    </SelectItem>
                    <SelectItem value="in_progress">
                      {t("dashboard:support.ticket.status.in_progress")}
                    </SelectItem>
                    <SelectItem value="closed">
                      {t("dashboard:support.ticket.status.closed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                    {t("dashboard:support.ticket.form.description")}
                  </p>
                  <p className="text-sm">{ticketDetail.data?.description}</p>
                  {/* Imagens do ticket */}
                  {ticketAttachments && ticketAttachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {ticketAttachments.map((att) => (
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

                {!ticketDetail.data?.replies?.length ? (
                  <p className="text-muted-foreground text-sm">
                    {t("dashboard:support.ticket.noReplies")}
                  </p>
                ) : (
                  (
                    ticketDetail.data.replies as {
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
                        {reply.isAdmin ? String(t("admin")) : String(t("user"))}
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

          <div className="flex flex-col gap-2 border-t p-4">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {t("dashboard:admin.tickets.reply.label")}
            </p>
            <Textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={t("dashboard:admin.tickets.reply.placeholder")}
              rows={3}
            />
            {/* Anexo para reply do admin */}
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
                      if (replyFileRef.current) replyFileRef.current.value = "";
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
              onClick={() => replyMutation.mutate({ message: replyMessage })}
              disabled={!replyMessage.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending && <Spinner />}
              {t("dashboard:admin.tickets.reply.cta")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
