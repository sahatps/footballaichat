export type Channel = "web" | "line";

export type Language = "en" | "th";

export type LiveFeedScope = "world-cup" | "all-live";

export type MatchStatus =
  | "LIVE"
  | "HT"
  | "FT"
  | "NS"
  | "POSTPONED"
  | "UNKNOWN";

export type TeamIdentity = {
  id: number;
  name: string;
  shortName?: string;
  logo?: string;
};

export type ScoreLine = {
  home: number;
  away: number;
};

export type LiveMatch = {
  id: number;
  season: number;
  leagueId: number;
  leagueName: string;
  leagueCountry?: string;
  leagueRound?: string;
  kickoff: string;
  venue?: string;
  minute?: number;
  status: MatchStatus;
  homeTeam: TeamIdentity;
  awayTeam: TeamIdentity;
  score: ScoreLine;
};

export type MatchEvent = {
  id: string;
  minute: number;
  team: "home" | "away" | "neutral";
  type: string;
  detail?: string;
  player?: string;
  assist?: string;
  comments?: string;
};

export type MatchStatItem = {
  label: string;
  home: string;
  away: string;
};

export type MatchStats = {
  items: MatchStatItem[];
};

export type MatchSummary = {
  match: LiveMatch;
  events: MatchEvent[];
  stats: MatchStats;
  source: "live" | "mock";
};

export type StandingRow = {
  rank: number;
  team: TeamIdentity;
  points: number;
  goalsDiff: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  form?: string;
};

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ConversationContext = {
  channel: Channel;
  sessionId: string;
  language: Language;
  focusedMatchId?: number;
  turns: ConversationTurn[];
  updatedAt: string;
};

export type ChatRequest = {
  message: string;
  sessionId: string;
  matchId?: number;
};

export type ChatResponse = {
  answer: string;
  language: Language;
  match?: LiveMatch;
  needsMatchClarification: boolean;
  source: "ai" | "fallback";
};

export type LiveMatchesResult = {
  matches: LiveMatch[];
  source: "live" | "mock";
  scope: LiveFeedScope;
  label: string;
};

export type StandingsResult = {
  rows: StandingRow[];
  source: "live" | "mock";
  label: string;
};

export type ConversationLog = {
  id: string;
  channel: Channel;
  sessionId: string;
  matchId?: number;
  userMessage: string;
  assistantMessage: string;
  language: Language;
  provider: "ai" | "fallback";
  error?: string;
  latencyMs?: number;
  createdAt: string;
};

export type LineInboundEvent = {
  type: string;
  replyToken?: string;
  timestamp: number;
  source: {
    type?: string;
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  message?: {
    id: string;
    type: string;
    text?: string;
  };
};
