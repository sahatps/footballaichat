import { z } from "zod";

const envSchema = z.object({
  API_FOOTBALL_KEY: z.string().optional(),
  ZAI_API_KEY: z.string().optional(),
  ZAI_MODEL: z.string().default("glm-4.7"),
  LINE_CHANNEL_ACCESS_TOKEN: z.string().optional(),
  LINE_CHANNEL_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
});

function cleanOptionalEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("paste_your_")) {
    return undefined;
  }

  return trimmed;
}

export function getConfig() {
  return envSchema.parse({
    API_FOOTBALL_KEY: cleanOptionalEnv(process.env.API_FOOTBALL_KEY),
    ZAI_API_KEY: cleanOptionalEnv(process.env.ZAI_API_KEY),
    ZAI_MODEL: process.env.ZAI_MODEL,
    LINE_CHANNEL_ACCESS_TOKEN: cleanOptionalEnv(process.env.LINE_CHANNEL_ACCESS_TOKEN),
    LINE_CHANNEL_SECRET: cleanOptionalEnv(process.env.LINE_CHANNEL_SECRET),
    DATABASE_URL: cleanOptionalEnv(process.env.DATABASE_URL),
  });
}
