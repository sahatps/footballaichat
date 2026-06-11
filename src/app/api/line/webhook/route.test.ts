// @vitest-environment node

import { createHmac } from "node:crypto";

import { POST, handleLineEvent } from "@/app/api/line/webhook/route";
import * as lineModule from "@/lib/line";

describe("POST /api/line/webhook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid signatures", async () => {
    process.env.LINE_CHANNEL_SECRET = "line-secret";

    const request = new Request("http://localhost/api/line/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-line-signature": "invalid",
      },
      body: JSON.stringify({ events: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("processes a valid webhook payload", async () => {
    process.env.LINE_CHANNEL_SECRET = "line-secret";
    const body = JSON.stringify({
      events: [
        {
          type: "message",
          replyToken: "reply-token",
          timestamp: Date.now(),
          source: { userId: "user-1" },
          message: {
            id: "msg-1",
            type: "text",
            text: "สรุป Manchester City vs Liverpool",
          },
        },
      ],
    });
    const signature = createHmac("sha256", "line-secret").update(body).digest("base64");
    const replySpy = vi.spyOn(lineModule, "replyToLine").mockResolvedValue({ ok: true, skipped: false });

    const request = new Request("http://localhost/api/line/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-line-signature": signature,
      },
      body,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(replySpy).toHaveBeenCalled();
  });

  it("ignores non-text events", async () => {
    const replySpy = vi.spyOn(lineModule, "replyToLine").mockResolvedValue({ ok: true, skipped: false });
    await handleLineEvent({
      type: "follow",
      timestamp: Date.now(),
      source: { userId: "user-2" },
    });

    expect(replySpy).not.toHaveBeenCalled();
  });
});
