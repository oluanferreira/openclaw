/* eslint-disable i18next/no-literal-string */
"use client";

import { useEffect, useState } from "react";

import { Button } from "@workspace/ui-web/button";
import { Card, CardContent } from "@workspace/ui-web/card";
import { Icons } from "@workspace/ui-web/icons";
import { Spinner } from "@workspace/ui-web/spinner";

import { useBridgeStatus } from "~/modules/dashboard/bridge/hooks/use-bridge";

const STORAGE_KEY = "bridge-onboarding-step";

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const STEPS = [
  {
    title: "Download Bridge App",
    icon: "Download" as const,
  },
  {
    title: "Install & Open",
    icon: "MonitorSmartphone" as const,
  },
  {
    title: "Copy & Paste Token",
    icon: "Key" as const,
  },
  {
    title: "Chrome Extension",
    icon: "Globe" as const,
  },
  {
    title: "Test Connection",
    icon: "CheckCircle" as const,
  },
];

export function OnboardingWizard({
  onComplete,
  onSkip,
}: OnboardingWizardProps) {
  const status = useBridgeStatus();

  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.min(Number(saved), 4) : 0;
  });

  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(step));
  }, [step]);

  // Auto-advance when bridge connects
  const isConnected = status.data?.connected ?? false;
  useEffect(() => {
    if (isConnected && step < 4) {
      setStep(4);
    }
  }, [isConnected, step]);

  const token = status.data?.token ?? "";

  const handleCopyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = token;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setTokenCopied(true);
    globalThis.setTimeout(() => setTokenCopied(false), 3000);
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "done");
    onComplete();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Setup ClaWin1Click Desktop</h2>
          <p className="text-muted-foreground text-sm">
            Connect your desktop to your AI agent in ~3 minutes
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onSkip}>
          Skip Setup
        </Button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-emerald-500" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {STEPS.map((s, i) => {
          const Icon = Icons[s.icon];
          const isActive = i === step;
          const isDone = i < step;

          return (
            <button
              key={s.title}
              onClick={() => setStep(i)}
              className={`flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 transition ${
                isActive
                  ? "text-emerald-500"
                  : isDone
                    ? "text-emerald-500/60"
                    : "text-muted-foreground/40"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isActive
                    ? "bg-emerald-500/20 ring-2 ring-emerald-500/30"
                    : isDone
                      ? "bg-emerald-500/10"
                      : "bg-muted/50"
                }`}
              >
                {isDone ? (
                  <Icons.Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </div>
              <span className="text-[10px] font-medium">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="p-6">
          {step === 0 && <StepDownload onNext={handleNext} />}
          {step === 1 && <StepInstall />}
          {step === 2 && (
            <StepToken
              token={token}
              tokenCopied={tokenCopied}
              isConnected={isConnected}
              isLoading={status.isLoading}
              onCopyToken={handleCopyToken}
            />
          )}
          {step === 3 && <StepExtension />}
          {step === 4 && (
            <StepTest
              isConnected={isConnected}
              deviceName={status.data?.deviceName}
              appVersion={status.data?.appVersion}
              capabilities={status.data?.capabilities}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={step === 0}
        >
          <Icons.ChevronLeft className="mr-1 size-4" />
          Back
        </Button>

        {step < 4 ? (
          <Button size="sm" onClick={handleNext}>
            Next
            <Icons.ChevronRight className="ml-1 size-4" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={!isConnected}
            className="gap-1.5"
          >
            <Icons.Check className="size-4" />
            Complete Setup
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Step Components ---

function StepDownload({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        icon="Download"
        title="Download ClaWin1Click Desktop"
        description="A lightweight desktop app (~3MB) that connects your PC to your AI agent."
      />
      <div className="flex flex-col gap-2">
        <Button
          className="w-full gap-2"
          size="lg"
          onClick={() => {
            window.open("/api/bridge/updates/download", "_blank");
            onNext();
          }}
        >
          <Icons.Download className="size-4" />
          Download for Windows
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Windows 10+ required. macOS and Linux coming soon.
        </p>
      </div>
    </div>
  );
}

function StepInstall() {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        icon="MonitorSmartphone"
        title="Install & Open"
        description="Run the downloaded installer and launch ClaWin1Click Desktop."
      />
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
        <Icons.ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="text-sm">
          <p className="font-medium text-amber-700 dark:text-amber-300">
            Windows SmartScreen warning
          </p>
          <p className="text-muted-foreground mt-0.5">
            Windows may show a &ldquo;protected your PC&rdquo; warning because
            the app is new. Click{" "}
            <strong>&ldquo;More info&rdquo;</strong> &rarr;{" "}
            <strong>&ldquo;Run anyway&rdquo;</strong> to proceed safely.
          </p>
        </div>
      </div>
      <div className="bg-muted/30 flex flex-col gap-3 rounded-lg p-4">
        <NumberedStep n={1}>
          Double-click{" "}
          <code className="bg-muted rounded px-1 text-xs">
            ClaWin1Click-Desktop_0.1.0_x64-setup.exe
          </code>
        </NumberedStep>
        <NumberedStep n={2}>
          Follow the installation wizard (~10 seconds)
        </NumberedStep>
        <NumberedStep n={3}>
          ClaWin1Click Desktop opens automatically &mdash; look for the tray icon in
          your taskbar
        </NumberedStep>
      </div>
    </div>
  );
}

function StepToken({
  token,
  tokenCopied,
  isConnected,
  isLoading,
  onCopyToken,
}: {
  token: string;
  tokenCopied: boolean;
  isConnected: boolean;
  isLoading: boolean;
  onCopyToken: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        icon="Key"
        title="Copy & Paste Token"
        description="This token pairs the Bridge app with your OpenClaw instance."
      />
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner className="size-5" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bg-muted/30 flex items-center justify-between gap-2 rounded-lg p-3">
            <code className="truncate text-xs">
              {token
                ? `${token.slice(0, 12)}...${token.slice(-6)}`
                : "Loading..."}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={onCopyToken}
              className="shrink-0 gap-1.5"
            >
              {tokenCopied ? (
                <>
                  <Icons.Check className="size-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Icons.Copy className="size-3.5" />
                  Copy Token
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted/20 flex items-start gap-2 rounded-lg p-3">
            <Icons.ArrowRight className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <p className="text-muted-foreground text-sm">
              Paste the token into the Bridge app and click{" "}
              <strong>Connect</strong>
            </p>
          </div>

          {isConnected && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <Icons.CheckCircle className="size-4 text-emerald-500" />
              <span className="text-sm text-emerald-500">
                Bridge connected! Token accepted.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepExtension() {
  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        icon="Globe"
        title="Install Chrome Extension"
        description="Allow your AI agent to browse the web on your behalf."
      />
      <div className="bg-muted/30 flex flex-col gap-3 rounded-lg p-4">
        <NumberedStep n={1}>
          Open a terminal and run:{" "}
          <code className="bg-muted rounded px-1 text-xs">
            openclaw browser extension install
          </code>
        </NumberedStep>
        <NumberedStep n={2}>
          Open Chrome &rarr;{" "}
          <code className="bg-muted rounded px-1 text-xs">
            chrome://extensions
          </code>
        </NumberedStep>
        <NumberedStep n={3}>
          Enable <strong>Developer mode</strong> (top-right)
        </NumberedStep>
        <NumberedStep n={4}>
          Click <strong>Load unpacked</strong> &rarr; select{" "}
          <code className="bg-muted rounded px-1 text-xs">
            ~/.openclaw/browser/chrome-extension/
          </code>
        </NumberedStep>
      </div>
      <p className="text-muted-foreground text-xs">
        This step is optional &mdash; skip if you only need terminal and file
        access.
      </p>
    </div>
  );
}

function StepTest({
  isConnected,
  deviceName,
  appVersion,
  capabilities,
}: {
  isConnected: boolean;
  deviceName?: string | null;
  appVersion?: string | null;
  capabilities?: Record<string, boolean> | null;
}) {
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-4">
        <StepHeader
          icon="CheckCircle"
          title="Test Connection"
          description="Waiting for the Bridge to connect..."
        />
        <div className="flex flex-col items-center gap-3 py-4">
          <Spinner className="size-6" />
          <p className="text-muted-foreground text-sm">
            Waiting for Bridge to connect...
          </p>
          <p className="text-muted-foreground text-xs">
            Make sure the Bridge app is running with the correct token.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <StepHeader
        icon="CheckCircle"
        title="Test Connection"
        description="Everything is working!"
      />
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
        <Icons.CheckCircle className="size-4 text-emerald-500" />
        <span className="text-sm text-emerald-500">
          Bridge is connected and working!
        </span>
      </div>

      <div className="bg-muted/30 flex flex-col gap-2 rounded-lg p-4">
        <p className="text-sm font-medium">Connection details:</p>
        <div className="text-muted-foreground space-y-1 text-xs">
          {deviceName && <p>Device: {deviceName}</p>}
          {appVersion && <p>Bridge version: v{appVersion}</p>}
          <p>
            Capabilities:{" "}
            {Object.entries(capabilities ?? {})
              .filter(([, v]) => v)
              .map(([k]) => k)
              .join(", ") || "none"}
          </p>
        </div>
      </div>

      <div className="bg-muted/20 flex items-start gap-2 rounded-lg p-3">
        <Icons.Zap className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <p className="text-muted-foreground text-sm">
          <strong>Try it out:</strong> Ask your AI agent to open google.com in
          your browser or run a terminal command.
        </p>
      </div>
    </div>
  );
}

// --- Shared Components ---

function StepHeader({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Icons;
  title: string;
  description: string;
}) {
  const Icon = Icons[icon];
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
        <Icon className="size-5 text-emerald-500" />
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function NumberedStep({
  n,
  children,
}: {
  n: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
        {n}
      </span>
      <p className="text-sm">{children}</p>
    </div>
  );
}
