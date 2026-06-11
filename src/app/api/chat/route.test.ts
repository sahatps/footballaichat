// @vitest-environment node

import { POST } from "@/app/api/chat/route";

describe("POST /api/chat", () => {
  it("returns a grounded chat response", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
      body: JSON.stringify({
        message: "Summarize Manchester City vs Liverpool",
        sessionId: "session-1",
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.answer).toBeTruthy();
    expect(json.needsMatchClarification).toBe(false);
  });

  it("validates request payload", async () => {
    const request = new Request("http://localhost/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.2",
      },
      body: JSON.stringify({
        message: "",
        sessionId: "session-2",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
