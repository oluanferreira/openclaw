export const Provider = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];

export const MODELS = [
  // Anthropic
  {
    id: "claude-opus-4-6",
    provider: "anthropic" as const,
    name: "Claude Opus 4.6",
    tier: "flagship" as const,
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic" as const,
    name: "Claude Sonnet 4.6",
    tier: "balanced" as const,
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic" as const,
    name: "Claude Haiku 4.5",
    tier: "fast" as const,
  },
  // OpenAI
  {
    id: "gpt-5.2",
    provider: "openai" as const,
    name: "GPT 5.2",
    tier: "flagship" as const,
  },
  {
    id: "o3",
    provider: "openai" as const,
    name: "o3",
    tier: "reasoning" as const,
  },
  {
    id: "o4-mini",
    provider: "openai" as const,
    name: "o4-mini",
    tier: "reasoning" as const,
  },
  {
    id: "gpt-4.1",
    provider: "openai" as const,
    name: "GPT 4.1",
    tier: "balanced" as const,
  },
  {
    id: "gpt-4.1-mini",
    provider: "openai" as const,
    name: "GPT 4.1 Mini",
    tier: "fast" as const,
  },
  // Google
  {
    id: "gemini-2.5-pro",
    provider: "google" as const,
    name: "Gemini 2.5 Pro",
    tier: "flagship" as const,
  },
  {
    id: "gemini-2.5-flash",
    provider: "google" as const,
    name: "Gemini 2.5 Flash",
    tier: "balanced" as const,
  },
  {
    id: "gemini-3-flash-preview",
    provider: "google" as const,
    name: "Gemini 3.0 Flash",
    tier: "fast" as const,
  },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
export type ModelTier = (typeof MODELS)[number]["tier"];

/** Set of all valid model IDs for quick validation */
export const VALID_MODEL_IDS = new Set<string>(MODELS.map((m) => m.id));

/** Map provider -> API key field name */
export const PROVIDER_TO_KEY: Record<Provider, string> = {
  openai: "openaiApiKey",
  anthropic: "anthropicApiKey",
  google: "googleApiKey",
};

/** Map provider -> default model (first flagship per provider) */
export const PROVIDER_DEFAULT_MODEL: Record<Provider, ModelId> = {
  anthropic: "claude-opus-4-6",
  openai: "gpt-5.2",
  google: "gemini-2.5-pro",
};

/** Get provider for a model ID (static fallback) */
export function getModelProvider(modelId: string): Provider | undefined {
  return MODELS.find((m) => m.id === modelId)?.provider;
}

/** Get API key field name for a model ID (static fallback) */
export function getModelKeyField(modelId: string): string | undefined {
  const provider = getModelProvider(modelId);
  return provider ? PROVIDER_TO_KEY[provider] : undefined;
}

/** Get API key field name from provider string */
export function getProviderKeyField(provider: string): string | undefined {
  return PROVIDER_TO_KEY[provider as Provider];
}
