/* eslint-disable i18next/no-literal-string */
"use client";

import { useState } from "react";

import { Badge } from "@workspace/ui-web/badge";
import { Button } from "@workspace/ui-web/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui-web/card";
import { Checkbox } from "@workspace/ui-web/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui-web/dialog";
import { Icons } from "@workspace/ui-web/icons";
import { Input } from "@workspace/ui-web/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui-web/select";
import { Spinner } from "@workspace/ui-web/spinner";

import {
  DashboardHeader,
  DashboardHeaderTitle,
  DashboardHeaderDescription,
} from "~/modules/common/layout/dashboard/header";
import {
  useBridgeStatus,
  useBridgeTerminal,
  useUpdateTerminal,
  useBridgeFiles,
  useUpdateFiles,
  useBridgeMobileStatus,
  useBridgeNotifications,
  useUpdateNotifications,
  useRotateToken,
} from "~/modules/dashboard/bridge/hooks/use-bridge";
import { OnboardingWizard } from "~/modules/dashboard/bridge/view/onboarding-wizard";

const CAP_LABELS: Record<string, string> = {
  browser: "Browser",
  terminal: "Terminal",
  clipboard: "Clipboard",
  files: "Files",
  notifications: "Notifications",
};

export const BridgeView = () => {
  const status = useBridgeStatus();
  const terminal = useBridgeTerminal();
  const updateTerminal = useUpdateTerminal();
  const rotateToken = useRotateToken();

  const files = useBridgeFiles();
  const updateFiles = useUpdateFiles();

  const notifications = useBridgeNotifications();
  const updateNotifications = useUpdateNotifications();

  const mobileStatus = useBridgeMobileStatus();

  const [editOpen, setEditOpen] = useState(false);
  const [allowlistText, setAllowlistText] = useState("");
  const [timeout, setTimeout] = useState("30");

  const [filesEditOpen, setFilesEditOpen] = useState(false);
  const [dirs, setDirs] = useState<
    { path: string; permission: "read" | "read-write" }[]
  >([]);
  const [blockedText, setBlockedText] = useState("");

  const [notifEditOpen, setNotifEditOpen] = useState(false);
  const [notifTypes, setNotifTypes] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState("");
  const [quietEnd, setQuietEnd] = useState("");

  const openNotifEdit = () => {
    if (notifications.data) {
      setNotifTypes([...notifications.data.allowedTypes]);
      setSoundEnabled(notifications.data.soundEnabled);
      setQuietStart(
        notifications.data.quietHoursStart != null
          ? String(notifications.data.quietHoursStart)
          : "",
      );
      setQuietEnd(
        notifications.data.quietHoursEnd != null
          ? String(notifications.data.quietHoursEnd)
          : "",
      );
    }
    setNotifEditOpen(true);
  };

  const handleNotifSave = () => {
    updateNotifications.mutate(
      {
        allowedTypes: notifTypes as ("info" | "alert" | "action")[],
        soundEnabled,
        quietHoursStart: quietStart ? Number(quietStart) : null,
        quietHoursEnd: quietEnd ? Number(quietEnd) : null,
      },
      { onSuccess: () => setNotifEditOpen(false) },
    );
  };

  const toggleNotifType = (type: string) => {
    setNotifTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const openEdit = () => {
    if (terminal.data) {
      setAllowlistText(terminal.data.allowlist.join("\n"));
      setTimeout(String(terminal.data.timeoutSeconds));
    }
    setEditOpen(true);
  };

  const handleSave = () => {
    const allowlist = allowlistText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const timeoutSeconds = Number(timeout);
    updateTerminal.mutate(
      { allowlist, timeoutSeconds },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const openFilesEdit = () => {
    if (files.data) {
      setDirs(files.data.allowedDirs.map((d) => ({ ...d })));
      setBlockedText(files.data.blockedPatterns.join("\n"));
    }
    setFilesEditOpen(true);
  };

  const handleFilesSave = () => {
    const blockedPatterns = blockedText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    updateFiles.mutate(
      { allowedDirs: dirs, blockedPatterns },
      { onSuccess: () => setFilesEditOpen(false) },
    );
  };

  const addDir = () =>
    setDirs((prev) => [...prev, { path: "", permission: "read" }]);
  const removeDir = (i: number) =>
    setDirs((prev) => prev.filter((_, idx) => idx !== i));
  const updateDir = (i: number, field: "path" | "permission", value: string) =>
    setDirs((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)),
    );

  const [tokenCopied, setTokenCopied] = useState(false);

  const handleCopyToken = async () => {
    const token = status.data?.token;
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = token;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setTokenCopied(true);
    globalThis.setTimeout(() => setTokenCopied(false), 3000);
  };

  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem("bridge-onboarding-step");
    return saved !== "done";
  });

  const maskedToken = status.data?.token
    ? `${status.data.token.slice(0, 8)}...${status.data.token.slice(-4)}`
    : "—";

  if (showOnboarding && !status.isLoading) {
    return (
      <>
        <DashboardHeader>
          <div>
            <DashboardHeaderTitle>Bridge</DashboardHeaderTitle>
            <DashboardHeaderDescription>
              Connect your desktop to your OpenClaw instance
            </DashboardHeaderDescription>
          </div>
        </DashboardHeader>
        <OnboardingWizard
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => {
            localStorage.setItem("bridge-onboarding-step", "done");
            setShowOnboarding(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <DashboardHeader>
        <div className="flex w-full items-center justify-between">
          <div>
            <DashboardHeaderTitle>Bridge</DashboardHeaderTitle>
            <DashboardHeaderDescription>
              Connect your desktop to your OpenClaw instance
            </DashboardHeaderDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() =>
                window.open("/api/bridge/updates/download", "_blank")
              }
            >
              <Icons.Download className="size-4" />
              Download App
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                localStorage.removeItem("bridge-onboarding-step");
                setShowOnboarding(true);
              }}
            >
              <Icons.RotateCcw className="size-4" />
              Setup Guide
            </Button>
          </div>
        </div>
      </DashboardHeader>

      {status.isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Connection Status */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="p-5 pb-0!">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`size-2.5 rounded-full ${status.data?.connected ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="text-lg font-medium">
                    {status.data?.connected ? "Connected" : "Disconnected"}
                  </span>
                </div>
                {status.data?.deviceName && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {status.data.deviceName}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-5 pb-0!">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Gateway Token
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm">{maskedToken}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyToken}
                      disabled={!status.data?.token}
                    >
                      {tokenCopied ? (
                        <Icons.Check className="size-4 text-green-500" />
                      ) : (
                        <Icons.Copy className="size-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => rotateToken.mutate()}
                      disabled={rotateToken.isPending}
                    >
                      {rotateToken.isPending ? (
                        <Spinner className="size-4" />
                      ) : (
                        <Icons.RefreshCw className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-5 pb-0!">
                <CardTitle className="text-muted-foreground text-sm font-normal">
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(status.data?.capabilities ?? {}).map(
                    ([key, val]) => (
                      <Badge
                        key={key}
                        variant={val ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {CAP_LABELS[key] ?? key}
                      </Badge>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terminal Config */}
          <section className="flex w-full flex-col gap-4">
            <span className="text-muted-foreground ml-1 text-sm uppercase">
              Terminal Settings
            </span>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icons.Terminal className="text-muted-foreground size-4" />
                      <span className="font-medium">Command Allowlist</span>
                    </div>
                    {terminal.isLoading ? (
                      <Spinner className="size-4" />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {(terminal.data?.allowlist ?? []).map((cmd) => (
                          <Badge
                            key={cmd}
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {cmd}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Timeout: {terminal.data?.timeoutSeconds ?? 30}s
                    </p>
                  </div>
                  <Dialog
                    open={editOpen}
                    onOpenChange={(v) => {
                      if (!v) setEditOpen(false);
                    }}
                  >
                    <DialogTrigger
                      render={
                        <Button variant="outline" size="sm" onClick={openEdit}>
                          Edit
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-md">
                      <DialogTitle>Terminal Configuration</DialogTitle>
                      <DialogDescription>
                        Commands matching the allowlist are auto-approved.
                        Others require manual confirmation in the Bridge app.
                      </DialogDescription>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-muted-foreground text-sm">
                            Allowed commands (one per line, glob patterns)
                          </label>
                          <textarea
                            className="border-input bg-background min-h-[120px] rounded-md border px-3 py-2 font-mono text-sm"
                            value={allowlistText}
                            onChange={(e) => setAllowlistText(e.target.value)}
                            placeholder={"git *\nnpm *\nls\npwd"}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-muted-foreground text-sm">
                            Timeout (seconds)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={300}
                            value={timeout}
                            onChange={(e) => setTimeout(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleSave}
                          disabled={updateTerminal.isPending}
                          className="w-full"
                        >
                          {updateTerminal.isPending ? (
                            <Spinner className="size-4" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Files Config */}
          <section className="flex w-full flex-col gap-4">
            <span className="text-muted-foreground ml-1 text-sm uppercase">
              File Access Settings
            </span>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icons.FolderOpen className="text-muted-foreground size-4" />
                      <span className="font-medium">Allowed Directories</span>
                    </div>
                    {files.isLoading ? (
                      <Spinner className="size-4" />
                    ) : (files.data?.allowedDirs ?? []).length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        No directories configured &mdash; file access is
                        disabled
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {(files.data?.allowedDirs ?? []).map((d, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs"
                            >
                              {d.path}
                            </Badge>
                            <Badge
                              variant={
                                d.permission === "read-write"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {d.permission}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      <Icons.ShieldAlert className="text-muted-foreground size-3.5" />
                      <span className="text-muted-foreground text-xs">
                        Blocked: {(files.data?.blockedPatterns ?? []).length}{" "}
                        patterns
                      </span>
                    </div>
                  </div>
                  <Dialog
                    open={filesEditOpen}
                    onOpenChange={(v) => {
                      if (!v) setFilesEditOpen(false);
                    }}
                  >
                    <DialogTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openFilesEdit}
                        >
                          Edit
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-lg">
                      <DialogTitle>File Access Configuration</DialogTitle>
                      <DialogDescription>
                        Configure which directories the AI agent can access on
                        your PC.
                      </DialogDescription>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-muted-foreground text-sm">
                              Allowed Directories
                            </label>
                            <Button variant="ghost" size="sm" onClick={addDir}>
                              <Icons.Plus className="mr-1 size-3" /> Add
                            </Button>
                          </div>
                          {dirs.length === 0 ? (
                            <p className="text-muted-foreground py-2 text-xs">
                              No directories &mdash; click Add to allow file
                              access.
                            </p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {dirs.map((d, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2"
                                >
                                  <Input
                                    className="flex-1 font-mono text-sm"
                                    placeholder="C:\Users\you\Projects"
                                    value={d.path}
                                    onChange={(e) =>
                                      updateDir(i, "path", e.target.value)
                                    }
                                  />
                                  <Select
                                    value={d.permission}
                                    onValueChange={(v) =>
                                      v && updateDir(i, "permission", v)
                                    }
                                  >
                                    <SelectTrigger className="w-[130px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="read">Read</SelectItem>
                                      <SelectItem value="read-write">
                                        Read-Write
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeDir(i)}
                                  >
                                    <Icons.X className="size-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-muted-foreground text-sm">
                            Blocked Patterns (one per line, glob patterns)
                          </label>
                          <textarea
                            className="border-input bg-background min-h-[100px] rounded-md border px-3 py-2 font-mono text-sm"
                            value={blockedText}
                            onChange={(e) => setBlockedText(e.target.value)}
                            placeholder={".env*\n*.pem\n*.key\n.ssh/"}
                          />
                        </div>
                        <Button
                          onClick={handleFilesSave}
                          disabled={updateFiles.isPending}
                          className="w-full"
                        >
                          {updateFiles.isPending ? (
                            <Spinner className="size-4" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Notification Settings */}
          <section className="flex w-full flex-col gap-4">
            <span className="text-muted-foreground ml-1 text-sm uppercase">
              Notification Settings
            </span>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icons.Bell className="text-muted-foreground size-4" />
                      <span className="font-medium">Desktop Notifications</span>
                    </div>
                    {notifications.isLoading ? (
                      <Spinner className="size-4" />
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-1.5">
                          {(notifications.data?.allowedTypes ?? []).map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-xs capitalize"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground text-xs">
                            Sound:{" "}
                            {notifications.data?.soundEnabled ? "On" : "Off"}
                          </span>
                          {notifications.data?.quietHoursStart != null && (
                            <div className="flex items-center gap-1">
                              <Icons.Moon className="text-muted-foreground size-3" />
                              <span className="text-muted-foreground text-xs">
                                Quiet: {notifications.data.quietHoursStart}
                                h&ndash;
                                {notifications.data.quietHoursEnd}h
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <Dialog
                    open={notifEditOpen}
                    onOpenChange={(v) => {
                      if (!v) setNotifEditOpen(false);
                    }}
                  >
                    <DialogTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openNotifEdit}
                        >
                          Edit
                        </Button>
                      }
                    />
                    <DialogContent className="sm:max-w-md">
                      <DialogTitle>Notification Preferences</DialogTitle>
                      <DialogDescription>
                        Configure which notifications the AI agent can send to
                        your desktop.
                      </DialogDescription>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-muted-foreground text-sm">
                            Allowed Types
                          </label>
                          <div className="flex flex-col gap-2">
                            {["info", "alert", "action"].map((type) => (
                              <label
                                key={type}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <Checkbox
                                  checked={notifTypes.includes(type)}
                                  onCheckedChange={() => toggleNotifType(type)}
                                />
                                <span className="text-sm capitalize">
                                  {type}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {type === "info" &&
                                    "\u2014 Status updates, progress info"}
                                  {type === "alert" &&
                                    "\u2014 Errors, attention needed"}
                                  {type === "action" &&
                                    "\u2014 Task completed, deploy done"}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm">Sound</label>
                          <Checkbox
                            checked={soundEnabled}
                            onCheckedChange={() => setSoundEnabled((v) => !v)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
                            <Icons.Moon className="size-3.5" />
                            Quiet Hours (optional)
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              placeholder="22"
                              value={quietStart}
                              onChange={(e) => setQuietStart(e.target.value)}
                              className="w-20"
                            />
                            <span className="text-muted-foreground text-sm">
                              to
                            </span>
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              placeholder="7"
                              value={quietEnd}
                              onChange={(e) => setQuietEnd(e.target.value)}
                              className="w-20"
                            />
                            <span className="text-muted-foreground text-xs">
                              (0-23h)
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={handleNotifSave}
                          disabled={updateNotifications.isPending}
                          className="w-full"
                        >
                          {updateNotifications.isPending ? (
                            <Spinner className="size-4" />
                          ) : (
                            "Save"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </section>
          {/* Mobile Companion */}
          <section className="flex w-full flex-col gap-4">
            <span className="text-muted-foreground ml-1 text-sm uppercase">
              Mobile Companion
            </span>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Icons.MonitorSmartphone className="text-muted-foreground size-4" />
                      <span className="font-medium">ClaWin Companion App</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Connect your phone to give the AI agent access to your
                      camera, contacts, location, and calendar.
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`size-2.5 rounded-full ${mobileStatus.data?.connected ? "bg-green-500" : "bg-gray-400"}`}
                        />
                        <span className="text-sm">
                          {mobileStatus.data?.connected
                            ? "Connected"
                            : "Not connected"}
                        </span>
                      </div>
                      {mobileStatus.data?.deviceName && (
                        <span className="text-muted-foreground text-xs">
                          {mobileStatus.data.deviceName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-dashed p-4">
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Setup
                  </p>
                  <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
                    <li>Install the ClaWin Companion app on your phone</li>
                    <li>
                      Open the app and paste your Gateway Token shown above
                    </li>
                    <li>
                      Approve permissions for camera, contacts, location, and
                      calendar
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </>
  );
};
