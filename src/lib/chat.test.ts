// @vitest-environment node

import { answerFootballQuestion } from "@/lib/chat";

describe("answerFootballQuestion", () => {
  const originalEnv = {
    API_FOOTBALL_KEY: process.env.API_FOOTBALL_KEY,
    ZAI_API_KEY: process.env.ZAI_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  };

  beforeEach(() => {
    process.env.API_FOOTBALL_KEY = "";
    process.env.ZAI_API_KEY = "";
    process.env.DATABASE_URL = "";
  });

  afterAll(() => {
    process.env.API_FOOTBALL_KEY = originalEnv.API_FOOTBALL_KEY;
    process.env.ZAI_API_KEY = originalEnv.ZAI_API_KEY;
    process.env.DATABASE_URL = originalEnv.DATABASE_URL;
  });

  it("defaults LINE questions to the current World Cup match when teams are not named", async () => {
    const response = await answerFootballQuestion({
      channel: "line",
      sessionId: "line-generic-session",
      message: "สรุปให้หน่อย",
      fallbackLanguage: "th",
    });

    expect(response.needsMatchClarification).toBe(false);
    expect(response.match?.leagueName).toContain("World Cup");
    expect(response.answer).not.toContain("ช่วยระบุชื่อทีม");
  });
});
