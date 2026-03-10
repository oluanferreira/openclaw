"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

import { useTranslation } from "@workspace/i18n";
import { updateCommunicationSchema } from "@workspace/openclaw/config";
import { Button } from "@workspace/ui-web/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui-web/dialog";
import { Field, FieldLabel } from "@workspace/ui-web/field";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import { Spinner } from "@workspace/ui-web/spinner";

import { useCommunication } from "~/modules/dashboard/instance/hooks/use-communication";

const TOKEN_REGEX = /^\d{8,10}:[A-Za-z0-9_-]{35}$/;

export const CommunicationSettings = () => {
  const { t } = useTranslation("dashboard");
  const { communication, updateCommunication } = useCommunication();
  const [open, setOpen] = useState(false);
  const [botPreview, setBotPreview] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  const form = useForm({
    resolver: standardSchemaResolver(updateCommunicationSchema),
    defaultValues: {
      channel: "telegram" as const,
      token: "",
    },
  });

  const tokenValue = form.watch("token");
  const isFormatValid = TOKEN_REGEX.test(tokenValue);

  const validateToken = async (token: string) => {
    if (!TOKEN_REGEX.test(token)) return;
    setValidating(true);
    setBotPreview(null);
    try {
      const res = await fetch(
        "https://api.telegram.org/bot" + token + "/getMe",
      );
      if (res.ok) {
        const data = (await res.json()) as {
          result?: { first_name?: string; username?: string };
        };
        setBotPreview(data.result?.first_name ?? data.result?.username ?? null);
      }
    } catch {
      setBotPreview(null);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = form.handleSubmit((data) => {
    updateCommunication.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setBotPreview(null);
      },
    });
  });

  const maskedToken = communication.data?.maskedToken;
  const currentBotName = communication.data?.botName;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-2">
          <Icons.Telegram className="size-5" />
          <span className="font-medium">
            {currentBotName || t("instance.settings.communication.noBot")}
          </span>
        </div>
        {maskedToken ? (
          <span className="text-muted-foreground font-mono text-xs">
            {maskedToken}
          </span>
        ) : null}
      </div>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            form.reset();
            setBotPreview(null);
          }
        }}
      >
        <DialogTrigger
          render={
            <Button variant="outline" size="sm">
              {maskedToken
                ? t("instance.settings.communication.editToken")
                : t("instance.settings.communication.addToken")}
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogTitle>
            {t("instance.settings.communication.dialogTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("instance.settings.communication.dialogDescription")}
          </DialogDescription>
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              void handleSubmit(e);
            }}
            className="flex flex-col gap-4"
          >
            <Controller
              control={form.control}
              name="token"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-muted-foreground"
                  >
                    {t(
                      "instance.deploy.communication.telegram.form.token.label",
                    )}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    onBlur={(e) => {
                      field.onBlur();
                      void validateToken(e.target.value);
                    }}
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                    autoFocus
                    className={
                      field.value.length > 0
                        ? isFormatValid
                          ? "border-green-500 focus-visible:ring-green-500/20"
                          : "border-red-500 focus-visible:ring-red-500/20"
                        : ""
                    }
                  />
                </Field>
              )}
            />
            {tokenValue.length > 0 && !isFormatValid && (
              <p className="text-destructive text-xs">
                {t("instance.settings.communication.invalidFormat")}
              </p>
            )}
            {validating && (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Spinner className="size-3" />
                {t("instance.settings.communication.validating")}
              </div>
            )}
            {botPreview && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Icons.Check className="size-3" />
                {t("instance.settings.communication.botFound", {
                  name: botPreview,
                })}
              </div>
            )}
            <Button
              type="submit"
              variant="foreground"
              className="w-full"
              disabled={!isFormatValid || updateCommunication.isPending}
            >
              {updateCommunication.isPending ? (
                <Spinner className="size-4" />
              ) : (
                t("instance.settings.communication.save")
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
