import { ConversationContext, Language, LiveMatch, MatchSummary } from "@/lib/types";

function formatStats(summary: MatchSummary) {
  return summary.stats.items
    .slice(0, 6)
    .map((item) => `- ${item.label}: ${item.home} vs ${item.away}`)
    .join("\n");
}

function formatEvents(summary: MatchSummary) {
  return summary.events
    .slice(-6)
    .map(
      (event) =>
        `- ${event.minute}' ${event.type}${event.player ? `, ${event.player}` : ""}${
          event.detail ? ` (${event.detail})` : ""
        }`,
    )
    .join("\n");
}

function formatLiveSnapshot(match: LiveMatch) {
  return [
    `Teams: ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    `Score: ${match.score.home}-${match.score.away}`,
    `Minute: ${match.minute ?? "N/A"}`,
    `Status: ${match.status}`,
    `Competition: ${match.leagueName}`,
  ].join("\n");
}

export function buildChatMessages({
  context,
  summary,
  question,
  language,
}: {
  context?: ConversationContext;
  summary?: MatchSummary | null;
  question: string;
  language: Language;
}) {
  const system =
    language === "th"
      ? "คุณคือผู้ช่วยวิเคราะห์ฟุตบอลแบบเรียลไทม์ ตอบกระชับ ชัดเจน ใช้เฉพาะข้อมูลการแข่งขันที่ให้มา และบอกตรงๆ หากข้อมูลไม่พอ"
      : "You are a realtime football analysis assistant. Be concise, clear, and use only the match data provided. Say clearly when data is insufficient.";

  const memory = context?.turns
    .slice(-4)
    .map((turn) => `${turn.role.toUpperCase()}: ${turn.content}`)
    .join("\n");

  const matchBlock = summary
    ? [
        "Match data:",
        formatLiveSnapshot(summary.match),
        "Recent events:",
        formatEvents(summary),
        "Key stats:",
        formatStats(summary),
      ].join("\n")
    : language === "th"
      ? "ยังไม่มีข้อมูลการแข่งขันที่ระบุชัดเจน"
      : "No specific match data is currently attached.";

  const prompt = [
    matchBlock,
    memory ? `Conversation context:\n${memory}` : "",
    `User request:\n${question}`,
    language === "th"
      ? "ข้อกำหนดการตอบ: ตอบเป็นภาษาไทยถ้าผู้ใช้ใช้ภาษาไทย ถ้าไม่มีข้อมูลพอให้แจ้งตรงๆ"
      : "Response requirements: answer in English unless the user used Thai; if data is insufficient, say so clearly.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    {
      role: "system",
      content: system,
    },
    {
      role: "user",
      content: prompt,
    },
  ];
}
