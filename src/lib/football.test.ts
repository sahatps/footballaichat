import { getLiveMatches, getMatchSummary } from "@/lib/football";
import { detectLanguage } from "@/lib/utils";

describe("football service fallbacks", () => {
  it("returns mock live matches when no API key is configured", async () => {
    delete process.env.API_FOOTBALL_KEY;
    const result = await getLiveMatches();

    expect(result.source).toBe("mock");
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it("returns mock world cup matches when the world cup scope is requested", async () => {
    delete process.env.API_FOOTBALL_KEY;
    const result = await getLiveMatches("world-cup");

    expect(result.scope).toBe("world-cup");
    expect(result.matches[0]?.leagueName).toContain("World Cup");
  });

  it("returns mock match summary for the sample fixture", async () => {
    delete process.env.API_FOOTBALL_KEY;
    const result = await getMatchSummary(900001);

    expect(result?.match.homeTeam.name).toBe("Manchester City");
    expect(result?.events.length).toBeGreaterThan(0);
  });

  it("detects Thai language", () => {
    expect(detectLanguage("สรุปเกมตอนนี้")).toBe("th");
    expect(detectLanguage("Summarize the match")).toBe("en");
  });
});
