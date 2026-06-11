import { NextResponse } from "next/server";

import { answerFootballQuestion } from "@/lib/chat";
import { enforceRateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/schemas";

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "web-anon";
}

export async function POST(request: Request) {
  try {
    const rateLimit = enforceRateLimit(`chat:${getClientKey(request)}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        },
      );
    }

    const body = await request.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const response = await answerFootballQuestion({
      channel: "web",
      sessionId: parsed.data.sessionId,
      message: parsed.data.message,
      explicitMatchId: parsed.data.matchId,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[/api/chat] request failed", error);
    return NextResponse.json(
      { error: "Chat service is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
