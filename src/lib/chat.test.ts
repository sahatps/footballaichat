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
  it("does not reuse the previously focused match for overview requests", async () => {
    await answerFootballQuestion({
      channel: "line",
      sessionId: "line-overview-session",
      message: "Summarize it",
      fallbackLanguage: "en",
    });

    const response = await answerFootballQuestion({
      channel: "line",
      sessionId: "line-overview-session",
      message: "How many matches are live today?",
      fallbackLanguage: "en",
    });

    expect(response.needsMatchClarification).toBe(false);
    expect(response.match).toBeUndefined();
    expect(response.answer).toContain("There are");
    expect(response.answer).toContain("live matches");
    expect(response.answer).not.toContain("Mexico lead South Africa");
  });

  it("handles mixed LINE conversation intents in one session", async () => {
    const sessionId = "line-mixed-session";

    const overview = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "วันนี้มีกี่คู่",
      fallbackLanguage: "th",
    });

    expect(overview.match).toBeUndefined();
    expect(overview.answer).toContain("ตอนนี้มีบอลสด");

    const defaultMatch = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "สรุปให้หน่อย",
      fallbackLanguage: "th",
    });

    expect(defaultMatch.match?.leagueName).toContain("World Cup");
    expect(defaultMatch.answer).toContain("Mexico");

    const followUp = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "ใครจะชนะ",
      fallbackLanguage: "th",
    });

    expect(followUp.match?.id).toBe(defaultMatch.match?.id);
    expect(followUp.answer).toContain("Mexico");

    const resetOverview = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "คู่อื่นมีไหม",
      fallbackLanguage: "th",
    });

    expect(resetOverview.match).toBeUndefined();
    expect(resetOverview.answer).toContain("คู่ที่น่าสนใจ");
    expect(resetOverview.answer).not.toContain("Mexico นำ South Africa");

    const explicitSwitch = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "Barcelona ตอนนี้เป็นไงบ้าง",
      fallbackLanguage: "th",
    });

    expect(explicitSwitch.match?.homeTeam.name).toBe("Real Madrid");
    expect(explicitSwitch.match?.awayTeam.name).toBe("Barcelona");
    expect(explicitSwitch.answer).toContain("Barcelona");
  });

  it("does not confuse generic words with team short names", async () => {
    const response = await answerFootballQuestion({
      channel: "line",
      sessionId: "line-token-match-session",
      message: "live matches",
      fallbackLanguage: "en",
    });

    expect(response.match).toBeUndefined();
    expect(response.answer).toContain("There are");
    expect(response.answer).toContain("Current slate:");
    expect(response.answer).not.toContain("Manchester City lead Liverpool");
  });

  it("keeps ambiguous short follow-ups on the focused match", async () => {
    const sessionId = "line-ambiguous-followup-session";

    const initial = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "Barcelona ตอนนี้เป็นไงบ้าง",
      fallbackLanguage: "th",
    });

    const ambiguous = await answerFootballQuestion({
      channel: "line",
      sessionId,
      message: "คู่นี้",
      fallbackLanguage: "th",
    });

    expect(initial.match?.id).toBeDefined();
    expect(ambiguous.match?.id).toBe(initial.match?.id);
    expect(ambiguous.answer).toContain("Barcelona");
  });

  it("treats very short generic messages as match clarification when no context exists", async () => {
    const response = await answerFootballQuestion({
      channel: "line",
      sessionId: "line-short-generic-session",
      message: "บอล",
      fallbackLanguage: "th",
    });

    expect(response.needsMatchClarification).toBe(true);
    expect(response.match).toBeUndefined();
  });
});
