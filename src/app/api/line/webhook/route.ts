import { NextResponse } from "next/server";

import { answerFootballQuestion } from "@/lib/chat";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getLineSessionId, replyToLine, verifyLineSignature } from "@/lib/line";
import { lineWebhookSchema } from "@/lib/schemas";
import { LineInboundEvent } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = lineWebhookSchema.safeParse(JSON.parse(body));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await Promise.all(parsed.data.events.map(async (event) => handleLineEvent(event)));

  return NextResponse.json({ ok: true });
}

export async function handleLineEvent(event: LineInboundEvent) {
  if (event.type !== "message" || event.message?.type !== "text" || !event.replyToken) {
    return;
  }

  const sessionId = getLineSessionId(event);
  const rateLimit = enforceRateLimit(`line:${sessionId}`, 12, 60_000);
  if (!rateLimit.allowed) {
    await replyToLine(
      event.replyToken,
      "คำขอถี่เกินไปชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
    );
    return;
  }

  const response = await answerFootballQuestion({
    channel: "line",
    sessionId,
    message: event.message.text ?? "",
    fallbackLanguage: "th",
  });

  await replyToLine(event.replyToken, response.answer);
}
