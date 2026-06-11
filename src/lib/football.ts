import { getConfig } from "@/lib/config";
import {
  DEFAULT_FEED_SCOPE,
  FEED_SCOPE_OPTIONS,
  getFeedScopeLabel as getScopeLabel,
  getMatchesCountLabel as getScopeMatchesCountLabel,
} from "@/lib/feed-scope";
import {
  buildMockMatchSummary,
  mockLiveMatches,
  mockStandings,
  mockWorldCupLiveMatches,
  mockWorldCupStandings,
} from "@/lib/mock-data";
import {
  LiveFeedScope,
  LiveMatch,
  LiveMatchesResult,
  MatchEvent,
  MatchStats,
  MatchStatus,
  MatchSummary,
  StandingRow,
  StandingsResult,
} from "@/lib/types";
import { getDefaultSeason } from "@/lib/utils";
import { createTimeoutSignal } from "@/lib/timeout";

const BASE_URL = "https://v3.football.api-sports.io";
const FOOTBALL_TIMEOUT_MS = 8000;

type ApiFootballResponse<T> = {
  response: T;
};

type RawFixtureResponse = {
  fixture: {
    id: number;
    date: string;
    status?: {
      short?: string;
      elapsed?: number | null;
    };
    venue?: {
      name?: string | null;
    };
  };
  league: {
    id: number;
    name: string;
    country?: string;
    round?: string;
    season: number;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo?: string;
    };
    away: {
      id: number;
      name: string;
      logo?: string;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type RawEvent = {
  time?: {
    elapsed?: number | null;
  };
  team?: {
    id?: number;
  };
  type?: string;
  detail?: string;
  comments?: string | null;
  player?: {
    name?: string | null;
  };
  assist?: {
    name?: string | null;
  };
};

type RawStatisticGroup = {
  statistics?: Array<{
    type: string;
    value: string | number | null;
  }>;
};

type RawStandingEnvelope = Array<{
  league?: {
    standings?: Array<
      Array<{
        rank: number;
        points: number;
        goalsDiff: number;
        form?: string;
        all?: {
          played: number;
          win: number;
          draw: number;
          lose: number;
        };
        team: {
          id: number;
          name: string;
          logo?: string;
        };
      }>
    >;
  };
}>;

function toMatchStatus(short?: string): MatchStatus {
  switch (short) {
    case "1H":
    case "2H":
    case "ET":
    case "P":
      return "LIVE";
    case "HT":
      return "HT";
    case "FT":
    case "AET":
    case "PEN":
      return "FT";
    case "NS":
    case "TBD":
      return "NS";
    case "PST":
    case "CANC":
      return "POSTPONED";
    default:
      return "UNKNOWN";
  }
}

function normalizeFixture(item: RawFixtureResponse): LiveMatch {
  return {
    id: item.fixture.id,
    season: item.league.season,
    leagueId: item.league.id,
    leagueName: item.league.name,
    leagueCountry: item.league.country,
    leagueRound: item.league.round,
    kickoff: item.fixture.date,
    venue: item.fixture.venue?.name ?? undefined,
    minute: item.fixture.status?.elapsed ?? undefined,
    status: toMatchStatus(item.fixture.status?.short),
    homeTeam: {
      id: item.teams.home.id,
      name: item.teams.home.name,
      logo: item.teams.home.logo,
    },
    awayTeam: {
      id: item.teams.away.id,
      name: item.teams.away.name,
      logo: item.teams.away.logo,
    },
    score: {
      home: item.goals.home ?? 0,
      away: item.goals.away ?? 0,
    },
  };
}

function normalizeEvent(match: LiveMatch, event: RawEvent, index: number): MatchEvent {
  const teamId = event.team?.id;

  return {
    id: `event-${index}-${event.time?.elapsed ?? 0}`,
    minute: event.time?.elapsed ?? 0,
    team:
      teamId === match.homeTeam.id ? "home" : teamId === match.awayTeam.id ? "away" : "neutral",
    type: event.type ?? "Event",
    detail: event.detail ?? undefined,
    comments: event.comments ?? undefined,
    player: event.player?.name ?? undefined,
    assist: event.assist?.name ?? undefined,
  };
}

function normalizeStats(groups: RawStatisticGroup[]): MatchStats {
  if (!groups.length) {
    return { items: [] };
  }

  const [home = { statistics: [] }, away = { statistics: [] }] = groups;
  const awayMap = new Map(
    (away.statistics ?? []).map((item) => [item.type, item.value === null ? "-" : String(item.value)]),
  );

  return {
    items: (home.statistics ?? []).map((item) => ({
      label: item.type,
      home: item.value === null ? "-" : String(item.value),
      away: awayMap.get(item.type) ?? "-",
    })),
  };
}

function isWorldCupMatch(match: LiveMatch) {
  return /world cup/i.test(match.leagueName);
}

function filterMatchesByScope(matches: LiveMatch[], scope: LiveFeedScope) {
  if (scope === "world-cup") {
    return matches.filter(isWorldCupMatch);
  }

  return matches;
}

function getMockMatchesForScope(scope: LiveFeedScope) {
  return scope === "world-cup" ? mockWorldCupLiveMatches : mockLiveMatches;
}

function getMockMatchById(matchId: number) {
  return [...mockLiveMatches, ...mockWorldCupLiveMatches].find((match) => match.id === matchId) ?? null;
}

function isMockFixtureId(matchId: number) {
  return getMockMatchById(matchId) !== null;
}

async function fetchFootball<T>(path: string, params: Record<string, string | number>) {
  const config = getConfig();

  if (!config.API_FOOTBALL_KEY) {
    return null;
  }

  const url = new URL(path, BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)));

  const { signal, cancel } = createTimeoutSignal(FOOTBALL_TIMEOUT_MS);
  const response = await fetch(url, {
    headers: {
      "x-apisports-key": config.API_FOOTBALL_KEY,
    },
    signal,
    next: {
      revalidate: 30,
    },
  });
  cancel();

  if (!response.ok) {
    throw new Error(`API-Football request failed: ${response.status}`);
  }

  return (await response.json()) as ApiFootballResponse<T>;
}

export async function getLiveMatches(scope: LiveFeedScope = "all-live"): Promise<LiveMatchesResult> {
  const payload = await fetchFootball<RawFixtureResponse[]>("/fixtures", {
    live: "all",
  }).catch(() => null);

  if (!payload?.response?.length) {
    return {
      matches: getMockMatchesForScope(scope),
      source: "mock" as const,
      scope,
      label: getScopeLabel(scope),
    };
  }

  const filteredMatches = filterMatchesByScope(payload.response.map(normalizeFixture), scope);
  if (!filteredMatches.length) {
    return {
      matches: getMockMatchesForScope(scope),
      source: "mock" as const,
      scope,
      label: getScopeLabel(scope),
    };
  }

  return {
    matches: filteredMatches,
    source: "live" as const,
    scope,
    label: getScopeLabel(scope),
  };
}

export async function getMatchSummary(matchId: number) {
  const config = getConfig();
  const mockMatch = getMockMatchById(matchId);

  if (!config.API_FOOTBALL_KEY || isMockFixtureId(matchId)) {
    return buildMockMatchSummary(mockMatch ?? { ...mockLiveMatches[0], id: matchId });
  }

  try {
    const [fixturePayload, eventPayload, statPayload] = await Promise.all([
      fetchFootball<RawFixtureResponse[]>("/fixtures", { id: matchId }),
      fetchFootball<RawEvent[]>("/fixtures/events", { fixture: matchId }),
      fetchFootball<RawStatisticGroup[]>("/fixtures/statistics", { fixture: matchId }),
    ]);

    const fixture = fixturePayload?.response?.[0];
    if (!fixture) {
      return mockMatch ? buildMockMatchSummary(mockMatch) : null;
    }

    const match = normalizeFixture(fixture);
    return {
      match,
      events: (eventPayload?.response ?? []).map((event, index) =>
        normalizeEvent(match, event, index),
      ),
      stats: normalizeStats(statPayload?.response ?? []),
      source: "live" as const,
    } satisfies MatchSummary;
  } catch {
    return mockMatch ? buildMockMatchSummary(mockMatch) : null;
  }
}

export async function getStandings(league = 39, season = getDefaultSeason()): Promise<StandingsResult> {
  const payload = await fetchFootball<RawStandingEnvelope>("/standings", {
    league,
    season,
  }).catch(() => null);

  const rows = payload?.response?.[0]?.league?.standings?.[0];
  if (!rows?.length) {
    return {
      rows: mockStandings,
      source: "mock" as const,
      label: "Premier League snapshot",
    };
  }

  return {
    rows: rows.map(
      (row) =>
        ({
          rank: row.rank,
          points: row.points,
          goalsDiff: row.goalsDiff,
          played: row.all?.played ?? 0,
          won: row.all?.win ?? 0,
          drawn: row.all?.draw ?? 0,
          lost: row.all?.lose ?? 0,
          form: row.form,
          team: {
            id: row.team.id,
            name: row.team.name,
            logo: row.team.logo,
          },
        }) satisfies StandingRow,
    ),
    source: "live" as const,
    label: "Premier League snapshot",
  };
}

export async function getStandingsForScope(
  scope: LiveFeedScope,
  matches?: LiveMatch[],
): Promise<StandingsResult> {
  if (scope === "world-cup") {
    const representative = matches?.find(isWorldCupMatch) ?? mockWorldCupLiveMatches[0];
    const payload = await fetchFootball<RawStandingEnvelope>("/standings", {
      league: representative.leagueId,
      season: representative.season,
    }).catch(() => null);

    const rows = payload?.response?.[0]?.league?.standings?.[0];
    if (!rows?.length) {
      return {
        rows: mockWorldCupStandings,
        source: "mock" as const,
        label: "World Cup Group A",
      };
    }

    return {
      rows: rows.map(
        (row) =>
          ({
            rank: row.rank,
            points: row.points,
            goalsDiff: row.goalsDiff,
            played: row.all?.played ?? 0,
            won: row.all?.win ?? 0,
            drawn: row.all?.draw ?? 0,
            lost: row.all?.lose ?? 0,
            form: row.form,
            team: {
              id: row.team.id,
              name: row.team.name,
              logo: row.team.logo,
            },
          }) satisfies StandingRow,
      ),
      source: "live" as const,
      label: "World Cup standings",
    };
  }

  return getStandings();
}

export function getFeedScopeLabel(scope: LiveFeedScope) {
  return getScopeLabel(scope);
}

export function getFeedScopeOptions(): Array<{ scope: LiveFeedScope; label: string }> {
  return FEED_SCOPE_OPTIONS;
}

export function getWorldCupScopeFallbackLabel() {
  return "World Cup";
}

export function getWorldCupMockMatches() {
  return mockWorldCupLiveMatches;
}

export function getAllLiveMockMatches() {
  return mockLiveMatches;
}

export function getWorldCupStandingsMock() {
  return mockWorldCupStandings;
}

export function getPremierLeagueStandingsMock() {
  return mockStandings;
}

export function isWorldCupScope(scope: LiveFeedScope) {
  return scope === "world-cup";
}

export function getMatchesForScopeFromMock(scope: LiveFeedScope) {
  return getMockMatchesForScope(scope);
}

export function getScopeByLeagueName(match: LiveMatch): LiveFeedScope {
  return isWorldCupMatch(match) ? "world-cup" : "all-live";
}

export function getDefaultScope(): LiveFeedScope {
  return DEFAULT_FEED_SCOPE;
}

export function getMatchesCountLabel(scope: LiveFeedScope) {
  return getScopeMatchesCountLabel(scope);
}

export function getLiveFeedMeta(scope: LiveFeedScope) {
  return {
    scope,
    label: getScopeLabel(scope),
  };
}

export async function resolveMatchFromText(text: string, candidates?: LiveMatch[]) {
  const live = candidates ?? (await getLiveMatches("all-live")).matches;
  const query = text.toLowerCase();

  return (
    live.find((match) =>
      [match.homeTeam.name, match.awayTeam.name, match.homeTeam.shortName, match.awayTeam.shortName]
        .filter(Boolean)
        .some((name) => query.includes(name!.toLowerCase())),
    ) ?? null
  );
}
