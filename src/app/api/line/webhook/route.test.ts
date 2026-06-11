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

  it("handles mixed LINE webhook conversation turns without repeating the previous match reply", async () => {
    const replySpy = vi.spyOn(lineModule, "replyToLine").mockResolvedValue({ ok: true, skipped: false });
    const baseEvent = {
      type: "message",
      timestamp: Date.now(),
      source: { userId: "user-mixed-1" },
      message: {
        id: "msg-seq",
        type: "text",
      },
    } as const;

    await handleLineEvent({
      ...baseEvent,
      replyToken: "reply-1",
      message: {
        ...baseEvent.message,
        text: "วันนี้มีกี่คู่",
      },
    });

    await handleLineEvent({
      ...baseEvent,
      replyToken: "reply-2",
      message: {
        ...baseEvent.message,
        text: "สรุปให้หน่อย",
      },
    });

    await handleLineEvent({
      ...baseEvent,
      replyToken: "reply-3",
      message: {
        ...baseEvent.message,
        text: "ใครจะชนะ",
      },
    });

    await handleLineEvent({
      ...baseEvent,
      replyToken: "reply-4",
      message: {
        ...baseEvent.message,
        text: "คู่อื่นมีไหม",
      },
    });

    await handleLineEvent({
      ...baseEvent,
      replyToken: "reply-5",
      message: {
        ...baseEvent.message,
        text: "Barcelona ตอนนี้เป็นไงบ้าง",
      },
    });

    expect(replySpy).toHaveBeenCalledTimes(5);
    expect(replySpy).toHaveBeenNthCalledWith(1, "reply-1", expect.stringContaining("ตอนนี้มีบอลสด"));
    expect(replySpy).toHaveBeenNthCalledWith(2, "reply-2", expect.stringContaining("Mexico"));
    expect(replySpy).toHaveBeenNthCalledWith(3, "reply-3", expect.stringContaining("Mexico"));
    expect(replySpy).toHaveBeenNthCalledWith(4, "reply-4", expect.not.stringContaining("Mexico นำ South Africa"));
    expect(replySpy).toHaveBeenNthCalledWith(5, "reply-5", expect.stringContaining("Barcelona"));
  });
  it("keeps LINE sessions isolated across different users", async () => {
    const replySpy = vi.spyOn(lineModule, "replyToLine").mockResolvedValue({ ok: true, skipped: false });

    await handleLineEvent({
      type: "message",
      replyToken: "user-a-1",
      timestamp: Date.now(),
      source: { userId: "user-a" },
      message: {
        id: "a-1",
        type: "text",
        text: "Barcelona ตอนนี้เป็นไงบ้าง",
      },
    });

    await handleLineEvent({
      type: "message",
      replyToken: "user-b-1",
      timestamp: Date.now(),
      source: { userId: "user-b" },
      message: {
        id: "b-1",
        type: "text",
        text: "คู่นี้",
      },
    });

    await handleLineEvent({
      type: "message",
      replyToken: "user-a-2",
      timestamp: Date.now(),
      source: { userId: "user-a" },
      message: {
        id: "a-2",
        type: "text",
        text: "คู่นี้",
      },
    });

    expect(replySpy).toHaveBeenNthCalledWith(1, "user-a-1", expect.stringContaining("Barcelona"));
    expect(replySpy).toHaveBeenNthCalledWith(2, "user-b-1", expect.stringContaining("ชื่อทีม"));
    expect(replySpy).toHaveBeenNthCalledWith(3, "user-a-2", expect.stringContaining("Barcelona"));
  });
});
