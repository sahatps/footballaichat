import { createHmac } from "node:crypto";

import { verifyLineSignature } from "@/lib/line";

describe("LINE signature verification", () => {
  it("verifies a valid signature", () => {
    process.env.LINE_CHANNEL_SECRET = "super-secret";
    const body = JSON.stringify({ events: [] });
    const signature = createHmac("sha256", "super-secret").update(body).digest("base64");

    expect(verifyLineSignature(body, signature)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    process.env.LINE_CHANNEL_SECRET = "super-secret";
    expect(verifyLineSignature("{}", "invalid")).toBe(false);
  });
});
