import { getConfig } from "@/lib/config";
import { buildChatMessages } from "@/lib/prompt";
import { createTimeoutSignal } from "@/lib/timeout";
import { ChatResponse, ConversationContext, Language, MatchSummary } from "@/lib/types";

type AiResult = {
  answer: string;
  source: "ai" | "fallback";
};

const AI_TIMEOUT_MS = 12000;

function extractAssistantText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const choice = (payload as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0];
  const content = choice?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) =>
        typeof item === "object" &&
        item &&
        "text" in item &&
        typeof item.text === "string"
          ? item.text
          : "",
      )
      .join("")
      .trim();
  }

  return null;
}

function buildFallbackAnswer({
  summary,
  question,
  language,
}: {
  summary?: MatchSummary | null;
  question: string;
  language: Language;
}) {
  if (!summary) {
    return language === "th"
      ? "ยังระบุแมตช์ไม่ชัดเจน ช่วยพิมพ์ชื่อทีม หรือเลือกแมตช์จากหน้าแดชบอร์ดก่อน แล้วฉันจะสรุปให้ได้ทันที"
      : "I need a specific match first. Please name the teams or choose a match from the dashboard, and I can summarize it right away.";
  }

  const latestEvent = summary.events.at(-1);
  const possession = summary.stats.items.find((item) => item.label.toLowerCase().includes("possession"));
  const shots = summary.stats.items.find((item) => item.label.toLowerCase().includes("shots on goal"));

  if (language === "th") {
    return [
      `${summary.match.homeTeam.name} นำ ${summary.match.awayTeam.name} ${summary.match.score.home}-${summary.match.score.away} นาที ${summary.match.minute ?? "-"}.`,
      possession
        ? `การครองบอล ${possession.home} ต่อ ${possession.away}`
        : "ยังไม่มีตัวเลขการครองบอลล่าสุด",
      shots ? `ยิงเข้ากรอบ ${shots.home} ต่อ ${shots.away}` : "ยังไม่มีสถิติยิงเข้ากรอบล่าสุด",
      latestEvent
        ? `จังหวะล่าสุด: ${latestEvent.minute}' ${latestEvent.type}${latestEvent.player ? ` โดย ${latestEvent.player}` : ""}.`
        : "ยังไม่มีเหตุการณ์สำคัญล่าสุดในข้อมูล",
      question.includes("advantage") || question.includes("ได้เปรียบ")
        ? "จากรูปเกมล่าสุด ฝั่งเจ้าบ้านดูคุมเกมได้มากกว่าเล็กน้อย"
        : "สรุปจากข้อมูลที่มี เกมยังเปิดอยู่และโมเมนตัมเปลี่ยนได้ตลอด",
    ].join(" ");
  }

  return [
    `${summary.match.homeTeam.name} lead ${summary.match.awayTeam.name} ${summary.match.score.home}-${summary.match.score.away} in minute ${summary.match.minute ?? "-"}.`,
    possession
      ? `Possession is ${possession.home} vs ${possession.away}.`
      : "The latest possession split is unavailable.",
    shots ? `Shots on target are ${shots.home} vs ${shots.away}.` : "The latest shots-on-target count is unavailable.",
    latestEvent
      ? `Latest key moment: ${latestEvent.minute}' ${latestEvent.type}${latestEvent.player ? ` by ${latestEvent.player}` : ""}.`
      : "No recent key event is available in the feed.",
    question.toLowerCase().includes("advantage")
      ? "Based on the current data, the home side have a slight control edge."
      : "Based on the current feed, the match remains live and the momentum can still swing.",
  ].join(" ");
}

export async function generateMatchAnswer({
  question,
  summary,
  language,
  context,
}: {
  question: string;
  summary?: MatchSummary | null;
  language: Language;
  context?: ConversationContext | null;
}): Promise<AiResult> {
  const config = getConfig();

  if (!config.ZAI_API_KEY) {
    return {
      answer: buildFallbackAnswer({ summary, question, language }),
      source: "fallback",
    };
  }

  const messages = buildChatMessages({
    context: context ?? undefined,
    summary,
    question,
    language,
  });

  try {
    const { signal, cancel } = createTimeoutSignal(AI_TIMEOUT_MS);
    const response = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.ZAI_API_KEY}`,
        "Content-Type": "application/json",
        "Accept-Language": language === "th" ? "th-TH,th;q=0.9,en;q=0.8" : "en-US,en;q=0.9",
      },
      signal,
      body: JSON.stringify({
        model: config.ZAI_MODEL,
        messages,
        temperature: 0.3,
      }),
    });
    cancel();

    if (!response.ok) {
      throw new Error(`z.ai request failed: ${response.status}`);
    }

    const payload = await response.json();
    const answer = extractAssistantText(payload);

    if (!answer) {
      throw new Error("z.ai response did not include assistant text");
    }

    return {
      answer,
      source: "ai",
    };
  } catch {
    return {
      answer: buildFallbackAnswer({ summary, question, language }),
      source: "fallback",
    };
  }
}

export function buildClarificationResponse(language: Language): ChatResponse {
  return {
    answer:
      language === "th"
        ? "ช่วยระบุชื่อทีม หรือเลือกแมตช์ก่อน แล้วฉันจะสรุปเกม วิเคราะห์โมเมนตัม หรือรายงานเหตุการณ์สำคัญให้ได้ทันที"
        : "Please name the teams or choose a match first, and I can summarize the game, analyze momentum, or report key events right away.",
    language,
    needsMatchClarification: true,
    source: "fallback",
  };
}
