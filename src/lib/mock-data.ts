import { MatchSummary, LiveMatch, StandingRow } from "@/lib/types";

export const mockLiveMatches: LiveMatch[] = [
  {
    id: 900001,
    season: 2025,
    leagueId: 39,
    leagueName: "Premier League",
    leagueCountry: "England",
    leagueRound: "Matchday 31",
    kickoff: "2026-06-10T18:00:00.000Z",
    venue: "Etihad Stadium",
    minute: 63,
    status: "LIVE",
    homeTeam: {
      id: 50,
      name: "Manchester City",
      shortName: "MCI",
      logo: "https://media.api-sports.io/football/teams/50.png",
    },
    awayTeam: {
      id: 40,
      name: "Liverpool",
      shortName: "LIV",
      logo: "https://media.api-sports.io/football/teams/40.png",
    },
    score: {
      home: 2,
      away: 1,
    },
  },
  {
    id: 900002,
    season: 2025,
    leagueId: 140,
    leagueName: "La Liga",
    leagueCountry: "Spain",
    leagueRound: "Matchday 34",
    kickoff: "2026-06-10T20:00:00.000Z",
    venue: "Estadio Santiago Bernabeu",
    minute: 28,
    status: "LIVE",
    homeTeam: {
      id: 541,
      name: "Real Madrid",
      shortName: "RMA",
      logo: "https://media.api-sports.io/football/teams/541.png",
    },
    awayTeam: {
      id: 529,
      name: "Barcelona",
      shortName: "BAR",
      logo: "https://media.api-sports.io/football/teams/529.png",
    },
    score: {
      home: 0,
      away: 0,
    },
  },
  {
    id: 900003,
    season: 2025,
    leagueId: 39,
    leagueName: "Premier League",
    leagueCountry: "England",
    leagueRound: "Matchday 31",
    kickoff: "2026-06-10T21:30:00.000Z",
    venue: "Stamford Bridge",
    status: "NS",
    homeTeam: {
      id: 49,
      name: "Chelsea",
      shortName: "CHE",
      logo: "https://media.api-sports.io/football/teams/49.png",
    },
    awayTeam: {
      id: 33,
      name: "Manchester United",
      shortName: "MUN",
      logo: "https://media.api-sports.io/football/teams/33.png",
    },
    score: {
      home: 0,
      away: 0,
    },
  },
];

export const mockWorldCupLiveMatches: LiveMatch[] = [
  {
    id: 960001,
    season: 2026,
    leagueId: 1,
    leagueName: "FIFA World Cup",
    leagueCountry: "World",
    leagueRound: "Group A - Matchday 1",
    kickoff: "2026-06-11T19:00:00.000Z",
    venue: "Estadio Azteca",
    minute: 67,
    status: "LIVE",
    homeTeam: {
      id: 16,
      name: "Mexico",
      shortName: "MEX",
      logo: "https://media.api-sports.io/football/teams/16.png",
    },
    awayTeam: {
      id: 2868,
      name: "South Africa",
      shortName: "RSA",
      logo: "https://media.api-sports.io/football/teams/2868.png",
    },
    score: {
      home: 1,
      away: 0,
    },
  },
  {
    id: 960002,
    season: 2026,
    leagueId: 1,
    leagueName: "FIFA World Cup",
    leagueCountry: "World",
    leagueRound: "Group B - Matchday 1",
    kickoff: "2026-06-12T01:00:00.000Z",
    venue: "SoFi Stadium",
    status: "NS",
    homeTeam: {
      id: 2384,
      name: "USA",
      shortName: "USA",
      logo: "https://media.api-sports.io/football/teams/2384.png",
    },
    awayTeam: {
      id: 1579,
      name: "Paraguay",
      shortName: "PAR",
      logo: "https://media.api-sports.io/football/teams/1579.png",
    },
    score: {
      home: 0,
      away: 0,
    },
  },
  {
    id: 960003,
    season: 2026,
    leagueId: 1,
    leagueName: "FIFA World Cup",
    leagueCountry: "World",
    leagueRound: "Group B - Matchday 1",
    kickoff: "2026-06-12T19:00:00.000Z",
    venue: "BMO Field",
    status: "NS",
    homeTeam: {
      id: 2382,
      name: "Canada",
      shortName: "CAN",
      logo: "https://media.api-sports.io/football/teams/2382.png",
    },
    awayTeam: {
      id: 2377,
      name: "Bosnia and Herzegovina",
      shortName: "BIH",
      logo: "https://media.api-sports.io/football/teams/2377.png",
    },
    score: {
      home: 0,
      away: 0,
    },
  },
];

export const mockStandings: StandingRow[] = [
  {
    rank: 1,
    team: mockLiveMatches[0].homeTeam,
    points: 73,
    goalsDiff: 41,
    played: 31,
    won: 23,
    drawn: 4,
    lost: 4,
    form: "WWDWW",
  },
  {
    rank: 2,
    team: mockLiveMatches[0].awayTeam,
    points: 70,
    goalsDiff: 36,
    played: 31,
    won: 22,
    drawn: 4,
    lost: 5,
    form: "WLWWW",
  },
  {
    rank: 3,
    team: mockLiveMatches[2].homeTeam,
    points: 63,
    goalsDiff: 25,
    played: 31,
    won: 19,
    drawn: 6,
    lost: 6,
    form: "WDWDW",
  },
  {
    rank: 4,
    team: mockLiveMatches[2].awayTeam,
    points: 57,
    goalsDiff: 9,
    played: 31,
    won: 17,
    drawn: 6,
    lost: 8,
    form: "LWWDW",
  },
];

export const mockWorldCupStandings: StandingRow[] = [
  {
    rank: 1,
    team: mockWorldCupLiveMatches[0].homeTeam,
    points: 3,
    goalsDiff: 1,
    played: 1,
    won: 1,
    drawn: 0,
    lost: 0,
    form: "W",
  },
  {
    rank: 2,
    team: {
      id: 2385,
      name: "Japan",
      shortName: "JPN",
      logo: "https://media.api-sports.io/football/teams/2385.png",
    },
    points: 1,
    goalsDiff: 0,
    played: 1,
    won: 0,
    drawn: 1,
    lost: 0,
    form: "D",
  },
  {
    rank: 3,
    team: {
      id: 2,
      name: "Morocco",
      shortName: "MAR",
      logo: "https://media.api-sports.io/football/teams/2.png",
    },
    points: 1,
    goalsDiff: 0,
    played: 1,
    won: 0,
    drawn: 1,
    lost: 0,
    form: "D",
  },
  {
    rank: 4,
    team: mockWorldCupLiveMatches[0].awayTeam,
    points: 0,
    goalsDiff: -1,
    played: 1,
    won: 0,
    drawn: 0,
    lost: 1,
    form: "L",
  },
];

const baseMockEventTemplate = [
  {
    minute: 14,
    team: "home" as const,
    type: "Goal",
    detail: "Clinical finish from inside the box",
  },
  {
    minute: 33,
    team: "away" as const,
    type: "Card",
    detail: "Yellow Card",
  },
  {
    minute: 57,
    team: "home" as const,
    type: "Substitution",
    detail: "Fresh legs in midfield",
  },
  {
    minute: 66,
    team: "home" as const,
    type: "Chance",
    detail: "Shot forced a sharp save",
  },
];

const baseMockStats = [
  {
    label: "Possession",
    home: "54%",
    away: "46%",
  },
  {
    label: "Shots on Goal",
    home: "5",
    away: "2",
  },
  {
    label: "Total Shots",
    home: "11",
    away: "7",
  },
  {
    label: "Expected Goals",
    home: "1.5",
    away: "0.7",
  },
];

export function buildMockMatchSummary(match: LiveMatch): MatchSummary {
  return {
    match,
    source: "mock",
    events: baseMockEventTemplate.map((event, index) => ({
      id: `${match.id}-event-${index}`,
      minute: event.minute,
      team: event.team,
      type: event.type,
      detail: event.detail,
      player: event.team === "home" ? match.homeTeam.name : match.awayTeam.name,
    })),
    stats: {
      items: baseMockStats,
    },
  };
}

export const mockMatchSummary: MatchSummary = buildMockMatchSummary(mockLiveMatches[0]);
