export const Plan = {
  PRO: "pro",
} as const;

export type Plan = (typeof Plan)[keyof typeof Plan];
