"use client";

import { useState } from "react";

import { useTranslation } from "@workspace/i18n";

interface GogSetupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function GogSetupDialog({
  isOpen,
  onClose,
  onComplete,
}: GogSetupDialogProps) {
  const { t } = useTranslation("dashboard");
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [authUrl, setAuthUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [account, setAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        setClientSecret(JSON.stringify(json));
        setError("");
      } catch {
        setError(t("skills.gog.setup.invalidJson"));
      }
    };
    reader.readAsText(file);
  };

  const handleStep1 = async () => {
    if (!clientSecret || !email) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/openclaw/skills/gog/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ step: 1, clientSecret, email }),
      });
      const data = (await res.json()) as {
        authUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Step 1 failed");
      setAuthUrl(data.authUrl ?? "");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!callbackUrl) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/openclaw/skills/gog/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ step: 2, callbackUrl }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        account?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "Step 2 failed");
      setAccount(data.account ?? email);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setEmail("");
    setClientSecret("");
    setAuthUrl("");
    setCallbackUrl("");
    setAccount("");
    setError("");
    onClose();
  };

  const handleComplete = () => {
    handleClose();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="border-border bg-card mx-4 w-full max-w-lg rounded-lg border p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t("skills.gog.setup.title")}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-green-500 text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? "\u2713" : s}
              </div>
              {s < 3 && (
                <div
                  className={`h-0.5 w-8 ${s < step ? "bg-green-500" : "bg-muted"}`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Upload client_secret */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {t("skills.gog.setup.step1Title")}
            </p>
            <div className="bg-muted/50 text-muted-foreground rounded-md p-3 text-xs">
              <ol className="list-inside list-decimal space-y-1">
                <li>{t("skills.gog.setup.instructions.1")}</li>
                <li>{t("skills.gog.setup.instructions.2")}</li>
                <li>{t("skills.gog.setup.instructions.3")}</li>
                <li>{t("skills.gog.setup.instructions.4")}</li>
                <li>{t("skills.gog.setup.instructions.5")}</li>
              </ol>
            </div>
            <div>
              <label className="block text-sm font-medium">
                {t("skills.gog.setup.emailLabel")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">
                {t("skills.gog.setup.uploadLabel")}
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="mt-1 w-full text-sm"
              />
              {clientSecret && (
                <p className="mt-1 text-xs text-green-600">
                  {t("skills.gog.setup.fileLoaded")}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleStep1}
              disabled={isLoading || !clientSecret || !email}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isLoading
                ? t("skills.gog.setup.processing")
                : t("skills.gog.setup.continue")}
            </button>
          </div>
        )}

        {/* Step 2: Auth URL + Callback */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-medium">
              {t("skills.gog.setup.step2Title")}
            </p>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs">
                {t("skills.gog.setup.step2Desc")}
              </p>
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {t("skills.gog.setup.openAuth")}
              </a>
            </div>
            <div>
              <label className="block text-sm font-medium">
                {t("skills.gog.setup.callbackLabel")}
              </label>
              <p className="text-muted-foreground mb-1 text-xs">
                {t("skills.gog.setup.callbackHint")}
              </p>
              <input
                type="text"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
                placeholder="http://127.0.0.1:xxxxx/oauth2/callback?code=..."
                className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2 font-mono text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleStep2}
              disabled={isLoading || !callbackUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {isLoading
                ? t("skills.gog.setup.processing")
                : t("skills.gog.setup.verify")}
            </button>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="space-y-4 text-center">
            <div className="text-4xl">&#9989;</div>
            <p className="text-sm font-medium">
              {t("skills.gog.setup.step3Title")}
            </p>
            <p className="text-muted-foreground text-sm">
              {t("skills.gog.setup.connectedAs", { account })}
            </p>
            <p className="text-muted-foreground text-xs">
              Gmail, Calendar, Drive, Contacts, Sheets, Docs
            </p>
            <button
              type="button"
              onClick={handleComplete}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-md px-4 py-2 text-sm font-medium"
            >
              {t("skills.gog.setup.done")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
