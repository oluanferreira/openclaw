import { Card } from "@workspace/ui-web/card";

const logs = [
  {
    time: "2026-02-22T17:57:30.915Z",
    message:
      "[canvas] host mounted at http://0.0.0.0:7777/__openclaw__/canvas/ (root /opt/openclaw/canvas)",
  },
  {
    time: "2026-02-22T17:57:31.040Z",
    message: "[heartbeat] started",
  },
  {
    time: "2026-02-22T17:57:31.042Z",
    message: "[health-monitor] started (interval: 300s, grace: 60s)",
  },
  {
    time: "2026-02-22T17:57:31.045Z",
    message: "[gateway] agent model: anthropic/claude-opus-4-6",
  },
  {
    time: "2026-02-22T17:57:31.047Z",
    message: "[gateway] listening on ws://0.0.0.0:7777 (PID 1)",
  },
  {
    time: "2026-02-22T17:57:31.048Z",
    message: "[gateway] log file: /tmp/openclaw/openclaw-2026-02-22.log",
  },
  {
    time: "2026-02-22T17:57:31.085Z",
    message: "[browser/service] Browser control service ready (profiles=2)",
  },
  {
    time: "2026-02-22T17:57:31.239Z",
    message: "[telegram] [default] starting provider (@GehhwBot)",
  },
  {
    time: "2026-02-22T17:57:31.263Z",
    message: "[telegram] autoSelectFamily=true (default-node22)",
  },
  {
    time: "2026-02-22T21:19:27.971Z",
    message:
      "[gateway] device pairing auto-approved device=663bfe266d92a81d5f2c1c7b24694ec27fb91304c742b2282fd1c13a63e0369d role=operator",
  },
  {
    time: "2026-02-22T21:20:07.579Z",
    message:
      "[ws] ⇄ res ✓ config.get 874ms conn=e95801d1…c1a0 id=e820eff7…9871",
  },
  {
    time: "2026-02-22T21:20:07.584Z",
    message: "[ws] ⇄ res ✓ status 881ms conn=e95801d1…c1a0 id=0cc6bfef…8e4c",
  },
];

export const InstanceLogs = () => {
  return (
    <section className="flex w-full grow flex-col gap-10">
      <Card className="w-full grow overflow-auto rounded-2xl border p-0">
        <pre className="py-4 font-mono text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
          {logs.map((log, idx) => (
            <div key={idx} className="hover:bg-muted px-5 py-1">
              <span className="text-muted-foreground">{log.time} </span>
              <span>{log.message}</span>
            </div>
          ))}
        </pre>
      </Card>
    </section>
  );
};
