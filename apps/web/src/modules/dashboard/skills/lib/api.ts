import { queryOptions } from "@tanstack/react-query";

const KEY = "skills";

interface SkillData {
  name: string;
  category: string;
  displayName: string;
  description: string;
  requiresBinary: string | null;
  requiresCredentials: boolean;
  credentialFields?: string[];
  credentialUrl?: string;
  enabled: boolean;
  configured: boolean;
  installedAt: string | null;
  lastError: string | null;
}

interface SkillsResponse {
  categories: {
    auto: SkillData[];
    config: SkillData[];
    install: SkillData[];
  };
}

const fetchSkills = async (): Promise<SkillsResponse> => {
  const res = await fetch("/api/openclaw/skills", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch skills");
  return res.json() as Promise<SkillsResponse>;
};

const toggleSkill = async (
  skillName: string,
  data: { enabled?: boolean; credentials?: Record<string, string> },
): Promise<{ success: boolean }> => {
  const res = await fetch(`/api/openclaw/skills/${skillName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({ error: "Unknown error" }))) as { error?: string };
    throw new Error(err.error || "Failed to update skill");
  }
  return res.json() as Promise<{ success: boolean }>;
};

const queries = {
  list: queryOptions({
    queryKey: [KEY, "list"],
    queryFn: fetchSkills,
  }),
};

export const skills = {
  queries,
  toggleSkill,
} as const;

export type { SkillData, SkillsResponse };
