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
}: {
  channel: Channel;
  sessionId: string;
  language: Language;
  matchId?: number;
  userMessage: string;
  answer: string;
  existing?: ConversationContext | null;
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
    focusedMatchId: matchId ?? existing?.focusedMatchId,
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
  const resolvedMatch =
    explicitMatchId
      ? candidateMatches.find((match) => match.id === explicitMatchId) ?? null
      : (await resolveMatchFromText(message, candidateMatches)) ??
        (existing?.focusedMatchId
          ? candidateMatches.find((match) => match.id === existing.focusedMatchId) ?? null
          : null) ??
        fallbackLineMatch;

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
