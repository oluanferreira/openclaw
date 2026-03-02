import { randomBytes } from "node:crypto";

export const getGatewayToken = () => randomBytes(32).toString("base64");

export const getInstanceId = (_userId: string) => {
  const firstChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  const rest = randomBytes(23)
    .toString("hex")
    .slice(0, 23)
    .replace(/[^a-z0-9]/g, "a");
  return `${firstChar}${rest}`.slice(0, 12);
};

export const escapeShell = (value: string) =>
  `'${value.replaceAll("'", "'\"'\"'")}'`;

export const toEscapedCommand = (args: readonly string[]) =>
  args.map((arg) => escapeShell(arg)).join(" ");
