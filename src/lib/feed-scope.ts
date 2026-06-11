import { LiveFeedScope } from "@/lib/types";

export const DEFAULT_FEED_SCOPE: LiveFeedScope = "world-cup";

export const FEED_SCOPE_OPTIONS: Array<{ scope: LiveFeedScope; label: string }> = [
  { scope: "world-cup", label: "World Cup" },
  { scope: "all-live", label: "All Live Matches" },
];

export function normalizeScope(scope: string | null): LiveFeedScope {
  return scope === "all-live" ? "all-live" : "world-cup";
}

export function getFeedScopeLabel(scope: LiveFeedScope) {
  return scope === "world-cup" ? "FIFA World Cup 2026" : "All Live Matches";
}

export function getMatchesCountLabel(scope: LiveFeedScope) {
  return scope === "world-cup"
    ? "World Cup fixtures in the current feed"
    : "Tracked fixtures in the current feed";
}
