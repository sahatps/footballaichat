import { randomUUID } from "node:crypto";

import { buildClarificationResponse, generateMatchAnswer } from "@/lib/ai";
import { getLiveMatches, getMatchSummary, resolveMatchFromText } from "@/lib/football";
import { appendConversationLog, getConversationContext, updateConversationContext } from "@/lib/store";
import {
  ChatResponse,
  Channel,
  ConversationContext,
  ConversationTurn,
  Language,
  LiveMatch,
} from "@/lib/types";
import { detectLanguage } from "@/lib/utils";

function buildNextContext({
  channel,
  sessionId,
  language,
  matchId,
  userMessage,
  answer,
  existing,
  clearMatchFocus,
}: {
  channel: Channel;
  sessionId: string;
  language: Language;
  matchId?: number;
  userMessage: string;
  answer: string;
  existing?: ConversationContext | null;
  clearMatchFocus?: boolean;
}): ConversationContext {
  const nextTurns: ConversationTurn[] = [
    ...(existing?.turns ?? []),
    { role: "user", content: userMessage },
    { role: "assistant", content: answer },
  ];

  return {
    channel,
    sessionId,
    language,
    focusedMatchId: clearMatchFocus ? undefined : matchId ?? existing?.focusedMatchId,
    turns: nextTurns.slice(-8),
    updatedAt: new Date().toISOString(),
  };
}

function uniqueMatches(matches: LiveMatch[]) {
  return matches.filter((match, index, items) => items.findIndex((item) => item.id === match.id) === index);
}

function isCurrentMatch(match: LiveMatch) {
  return match.status === "LIVE" || match.status === "HT";
}

function pickDefaultLineMatch(worldCupMatches: LiveMatch[], allLiveMatches: LiveMatch[]) {
  const worldCupCurrent = worldCupMatches.find(isCurrentMatch);
  if (worldCupCurrent) {
    return worldCupCurrent;
  }

  if (worldCupMatches.length > 0) {
    return worldCupMatches[0];
  }

  const liveCurrent = allLiveMatches.find(isCurrentMatch);
  if (liveCurrent) {
    return liveCurrent;
  }

  return allLiveMatches[0] ?? null;
}

function normalizeMessage(message: string) {
  return message.trim().toLowerCase();
}

function hasKeyword(message: string, keywords: string[]) {
  return keywords.some((keyword) => message.includes(keyword));
}

function isOverviewIntent(message: string) {
  const normalized = normalizeMessage(message);

  return hasKeyword(normalized, [
    "today",
    "todays",
    "how many",
    "which teams",
    "what teams",
    "what matches",
    "what games",
    "available matches",
    "available games",
    "all matches",
    "other matches",
    "other games",
    "live matches",
    "live games",
    "teams are playing",
    "มีอะไรบ้าง",
    "มีทีมอะไรบ้าง",
    "ทีมอะไรบ้าง",
    "มีคู่ไหนบ้าง",
    "คู่ไหนบ้าง",
    "fixtures",
    "schedule",
    "ประเทศ",
    "คู่อื่น",
    "มีคู่",
    "มีกี่คู่",
    "วันนี้",
    "โปรแกรม",
    "ทั้งหมด",
  ]);
}

function isMatchFollowUpIntent(message: string) {
  const normalized = normalizeMessage(message);

  return hasKeyword(normalized, [
    "summary",
    "score",
    "minute",
    "momentum",
    "who will win",
    "who wins",
    "advantage",
    "this match",
    "this game",
    "key event",
    "possession",
    "shots",
    "odds",
    "สรุป",
    "ใครจะชนะ",
    "นำ",
    "สกอร์",
    "นาที",
    "โมเมนตัม",
    "คู่นี้",
    "เกมนี้",
    "จังหวะ",
    "ครองบอล",
    "ยิง",
  ]);
}

function isDefaultLineFallbackIntent(message: string) {
  const normalized = normalizeMessage(message);

  return hasKeyword(normalized, [
    "summary",
    "score",
    "minute",
    "momentum",
    "who will win",
    "who wins",
    "advantage",
    "key event",
    "possession",
    "shots",
    "odds",
    "สรุป",
    "ใครจะชนะ",
    "นำ",
    "สกอร์",
    "นาที",
    "โมเมนตัม",
    "จังหวะ",
    "ครองบอล",
    "ยิง",
  ]);
}

function buildOverviewAnswer({
  language,
  matches,
}: {
  language: Language;
  matches: LiveMatch[];
}) {
  const liveMatches = matches.filter((match) => match.status === "LIVE" || match.status === "HT");
  const upcomingMatches = matches.filter((match) => match.status === "NS");
  const lines = [...liveMatches, ...upcomingMatches].slice(0, 4).map((match) => {
    const statusLabel =
      match.status === "LIVE" || match.status === "HT"
        ? `${match.minute ?? "-"}'`
        : new Date(match.kickoff).toLocaleTimeString(language === "th" ? "th-TH" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

    return language === "th"
      ? `- ${match.homeTeam.name} พบ ${match.awayTeam.name} (${match.leagueName}, ${statusLabel})`
      : `- ${match.homeTeam.name} vs ${match.awayTeam.name} (${match.leagueName}, ${statusLabel})`;
  });

  if (language === "th") {
    return [
      `ตอนนี้มีบอลสด ${liveMatches.length} คู่ และคู่ที่ยังไม่เริ่ม ${upcomingMatches.length} คู่ใน feed.`,
      lines.length ? `คู่ที่น่าสนใจ:\n${lines.join("\n")}` : "ตอนนี้ยังไม่มีคู่ให้สรุปเพิ่มใน feed.",
      "ถ้าต้องการเจาะคู่ไหน พิมพ์ชื่อทีมได้เลย",
    ].join("\n");
  }

  return [
    `There are ${liveMatches.length} live matches and ${upcomingMatches.length} upcoming matches in the current feed.`,
    lines.length ? `Current slate:\n${lines.join("\n")}` : "There are no additional matches in the current feed.",
    "If you want a deeper read on one match, send the team names.",
  ].join("\n");
}

export async function answerFootballQuestion({
  channel,
  sessionId,
  message,
  explicitMatchId,
  fallbackLanguage,
}: {
  channel: Channel;
  sessionId: string;
  message: string;
  explicitMatchId?: number;
  fallbackLanguage?: Language;
}): Promise<ChatResponse> {
  const language = detectLanguage(message, fallbackLanguage ?? (channel === "line" ? "th" : "en"));
  const existing = await getConversationContext(channel, sessionId);
  const start = Date.now();
  const [worldCupSnapshot, allLiveSnapshot] = await Promise.all([
    getLiveMatches("world-cup"),
    getLiveMatches("all-live"),
  ]);
  const candidateMatches = uniqueMatches([...worldCupSnapshot.matches, ...allLiveSnapshot.matches]);
  const fallbackLineMatch = channel === "line" ? pickDefaultLineMatch(worldCupSnapshot.matches, allLiveSnapshot.matches) : null;
  const mentionedMatch = explicitMatchId ? null : await resolveMatchFromText(message, candidateMatches);
  const canReuseFocusedMatch = isMatchFollowUpIntent(message);
  const canUseDefaultLineMatch =
    channel === "line" && isDefaultLineFallbackIntent(message) && !isOverviewIntent(message);
  const resolvedMatch =
    explicitMatchId
      ? candidateMatches.find((match) => match.id === explicitMatchId) ?? null
      : mentionedMatch ??
        (canReuseFocusedMatch && existing?.focusedMatchId
          ? candidateMatches.find((match) => match.id === existing.focusedMatchId) ?? null
          : null) ??
        (canUseDefaultLineMatch ? fallbackLineMatch : null);

  if (!resolvedMatch && isOverviewIntent(message)) {
    const answer = buildOverviewAnswer({
      language,
      matches: candidateMatches,
    });

    await updateConversationContext(
      buildNextContext({
        channel,
        sessionId,
        language,
        userMessage: message,
        answer,
        existing,
        clearMatchFocus: true,
      }),
    );

    const response: ChatResponse = {
      answer,
      language,
      needsMatchClarification: false,
      source: "fallback",
    };

    await appendConversationLog({
      id: randomUUID(),
      channel,
      sessionId,
      userMessage: message,
      assistantMessage: response.answer,
      language,
      provider: response.source,
      latencyMs: Date.now() - start,
      createdAt: new Date().toISOString(),
    });

    return response;
  }

  if (!resolvedMatch && !explicitMatchId) {
    return buildClarificationResponse(language);
  }

  const targetMatchId = explicitMatchId ?? resolvedMatch?.id;
  const summary = targetMatchId ? await getMatchSummary(targetMatchId) : null;
  const ai = await generateMatchAnswer({
    question: message,
    summary,
    language,
    context: existing,
  });

  const response: ChatResponse = {
    answer: ai.answer,
    language,
    match: summary?.match,
    needsMatchClarification: false,
    source: ai.source,
  };

  await updateConversationContext(
    buildNextContext({
      channel,
      sessionId,
      language,
      matchId: summary?.match.id,
      userMessage: message,
      answer: response.answer,
      existing,
      clearMatchFocus: false,
    }),
  );

  await appendConversationLog({
    id: randomUUID(),
    channel,
    sessionId,
    matchId: summary?.match.id,
    userMessage: message,
    assistantMessage: response.answer,
    language,
    provider: ai.source,
    latencyMs: Date.now() - start,
    createdAt: new Date().toISOString(),
  });

  return response;
}
