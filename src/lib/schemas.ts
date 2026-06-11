import { z } from "zod";

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  sessionId: z.string().trim().min(1).max(120),
  matchId: z.number().int().positive().optional(),
});

export const lineWebhookSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      replyToken: z.string().optional(),
      timestamp: z.number(),
      source: z.object({
        type: z.string().optional(),
        userId: z.string().optional(),
        groupId: z.string().optional(),
        roomId: z.string().optional(),
      }),
      message: z
        .object({
          id: z.string(),
          type: z.string(),
          text: z.string().optional(),
        })
        .optional(),
    }),
  ),
});
