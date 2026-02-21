export const Model = {
  CLAUDE_OPUS_4_6: "claude-opus-4.6",
  OPENAI_5_2: "openai-5.2",
  GEMINI_3_0_FLASH: "gemini-3.0-flash",
} as const;

export type Model = (typeof Model)[keyof typeof Model];

export const MODELS = [
  {
    id: Model.CLAUDE_OPUS_4_6,
    name: "Claude Opus 4.6",
  },
  {
    id: Model.OPENAI_5_2,
    name: "GPT 5.2",
  },
  {
    id: Model.GEMINI_3_0_FLASH,
    name: "Gemini 3.0 Flash",
  },
] as const;
