export const Provider = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GOOGLE: "google",
} as const;

export type Provider = (typeof Provider)[keyof typeof Provider];

export const Model = {
  CLAUDE_OPUS_4_6: "claude-opus-4-6",
  GPT_5_2: "gpt-5.2",
  GEMINI_3_0_FLASH: "gemini-3-0-flash",
} as const;

export type Model = (typeof Model)[keyof typeof Model];

export const MODELS = [
  {
    id: Model.CLAUDE_OPUS_4_6,
    provider: Provider.ANTHROPIC,
    name: "Claude Opus 4.6",
  },
  {
    id: Model.GPT_5_2,
    provider: Provider.OPENAI,
    name: "GPT 5.2",
  },
  {
    id: Model.GEMINI_3_0_FLASH,
    provider: Provider.GOOGLE,
    name: "Gemini 3.0 Flash",
  },
] as const;
