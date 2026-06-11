import { createHmac, timingSafeEqual } from "node:crypto";

import { getConfig } from "@/lib/config";
import { LineInboundEvent } from "@/lib/types";

export function verifyLineSignature(body: string, signature: string | null) {
  const config = getConfig();
  if (!signature || !config.LINE_CHANNEL_SECRET) {
    return false;
  }

  const digest = createHmac("sha256", config.LINE_CHANNEL_SECRET).update(body).digest("base64");
  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(digestBuffer, signatureBuffer);
}

export async function replyToLine(replyToken: string, message: string) {
  const config = getConfig();

  if (!config.LINE_CHANNEL_ACCESS_TOKEN) {
    return { ok: false, skipped: true };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.LINE_CHANNEL_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      replyToken,
      messages: [
        {
          type: "text",
          text: message.slice(0, 4900),
        },
      ],
    }),
  });

  return {
    ok: response.ok,
    skipped: false,
  };
}

export function getLineSessionId(event: LineInboundEvent) {
  return event.source.userId ?? event.source.groupId ?? event.source.roomId ?? "anonymous-line";
}
