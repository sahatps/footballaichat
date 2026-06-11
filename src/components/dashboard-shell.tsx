"use client";

import { useState } from "react";

import { ChatPanel } from "@/components/chat-panel";
import { LiveMatchCard } from "@/components/live-match-card";
import { StandingsTable } from "@/components/standings-table";
import {
  DEFAULT_FEED_SCOPE,
  FEED_SCOPE_OPTIONS,
  getMatchesCountLabel,
} from "@/lib/feed-scope";
import { LiveFeedScope, LiveMatchesResult, StandingsResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type DashboardShellProps = {
  feeds: Record<LiveFeedScope, LiveMatchesResult>;
  standingsByScope: Record<LiveFeedScope, StandingsResult>;
};

export function DashboardShell({ feeds, standingsByScope }: DashboardShellProps) {
  const [scope, setScope] = useState<LiveFeedScope>(DEFAULT_FEED_SCOPE);
  const live = feeds[scope];
  const standings = standingsByScope[scope];
  const selectedMatch = live.matches[0];

  return (
    <>
      <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(11,27,45,0.96),rgba(10,17,28,0.86))] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.38)] sm:px-8 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--accent)]">MatchPulse</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Realtime football data, shared AI match analysis, and LINE-ready reply flows on Vercel.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Live scores, events, standings, and one orchestration layer for both the dashboard chat and the LINE bot.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                API-Football proxy
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                z.ai responses
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                LINE webhook
              </span>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Live feed mode</p>
                <div className="inline-flex rounded-full border border-white/10 bg-[#08121d] p-1">
                  {FEED_SCOPE_OPTIONS.map((option) => (
                    <button
                      key={option.scope}
                      type="button"
                      onClick={() => setScope(option.scope)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-xs font-medium transition",
                        scope === option.scope
                          ? "bg-[var(--accent)] text-slate-950"
                          : "text-slate-300 hover:text-white",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-5xl font-semibold">{live.matches.length}</p>
                  <p className="mt-2 text-sm text-slate-300">{getMatchesCountLabel(scope)}</p>
                </div>
                <div className="text-right">
                  <p className="rounded-full bg-[rgba(150,255,102,0.14)] px-3 py-1 text-xs text-[var(--accent)]">
                    {live.source === "live" ? "Provider live" : "Mock fallback"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{live.label}</p>
                </div>
              </div>
            </div>
            <ChatPanel selectedMatch={selectedMatch} />
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-strong)]">Dashboard</p>
              <h2 className="mt-2 text-3xl font-semibold">{live.label}</h2>
            </div>
          </div>
          <div className="grid gap-4">
            {live.matches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
        <StandingsTable rows={standings.rows} title={standings.label} />
      </section>
    </>
  );
}
