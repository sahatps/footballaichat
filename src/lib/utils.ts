import { Language, MatchStatus } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function detectLanguage(input: string, fallback: Language = "en"): Language {
  if (/[\u0E00-\u0E7F]/u.test(input)) {
    return "th";
  }

  if (/[a-z]/i.test(input)) {
    return "en";
  }

  return fallback;
}

export function getDefaultSeason(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return month >= 6 ? year : year - 1;
}

export function getMinuteLabel(status: MatchStatus, minute?: number) {
  if (status === "LIVE" && typeof minute === "number") {
    return `${minute}'`;
  }

  if (status === "HT") {
    return "HT";
  }

  if (status === "FT") {
    return "FT";
  }

  if (status === "NS") {
    return "Upcoming";
  }

  if (status === "POSTPONED") {
    return "Postponed";
  }

  return status;
}

export function isLiveStatus(status: MatchStatus) {
  return status === "LIVE" || status === "HT";
}

export function formatKickoff(iso: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
