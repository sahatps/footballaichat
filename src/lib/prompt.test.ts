import { mockMatchSummary } from "@/lib/mock-data";
import { buildChatMessages } from "@/lib/prompt";

describe("prompt builder", () => {
  it("includes match and event context in the user message", () => {
    const messages = buildChatMessages({
      summary: mockMatchSummary,
      question: "Summarize the first half",
      language: "en",
    });

    expect(messages[1].content).toContain("Manchester City vs Liverpool");
    expect(messages[1].content).toContain("Recent events");
    expect(messages[1].content).toContain("Summarize the first half");
  });
});
