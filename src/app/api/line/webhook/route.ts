import { NextResponse } from "next/server";

import { answerFootballQuestion } from "@/lib/chat";
import { getLineSessionId, replyToLine, verifyLineSignature } from "@/lib/line";
import { enforceRateLimit } from "@/lib/rate-limit";
import { lineWebhookSchema } from "@/lib/schemas";
import { LineInboundEvent } from "@/lib/types";

const LINE_RATE_LIMIT_MESSAGE = "คำขอถี่เกินไปชั่วคราว กรุณารอสักครู่แล้วลองใหม่อีกครั้ง";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-line-signature");

    if (!verifyLineSignature(body, signature)) {
      console.error("[line] invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const parsed = lineWebhookSchema.safeParse(JSON.parse(body));
    if (!parsed.success) {
      console.error("[line] invalid webhook payload", parsed.error.flatten());
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await Promise.all(parsed.data.events.map(async (event) => handleLineEvent(event)));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[line] webhook request failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function handleLineEvent(event: LineInboundEvent) {
  if (event.type !== "message" || event.message?.type !== "text" || !event.replyToken) {
    return;
  }

  const sessionId = getLineSessionId(event);
  const text = event.message.text ?? "";
  const rateLimit = enforceRateLimit(`line:${sessionId}`, 12, 60_000);

  if (!rateLimit.allowed) {
    await replyToLine(event.replyToken, LINE_RATE_LIMIT_MESSAGE);
    return;
  }

  console.info("[line] processing inbound message", {
    sessionId,
    text,
  });

  const response = await answerFootballQuestion({
    channel: "line",
    sessionId,
    message: text,
    fallbackLanguage: "th",
  });

  await replyToLine(event.replyToken, response.answer);
}
