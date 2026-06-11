import Image from "next/image";

import { MatchSummary } from "@/lib/types";
import { formatKickoff, getMinuteLabel } from "@/lib/utils";

export function MatchDetail({ summary }: { summary: MatchSummary }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[var(--card-strong)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.26)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">{summary.match.leagueName}</p>
          <h1 className="mt-2 text-3xl font-semibold">
            {summary.match.homeTeam.name} vs {summary.match.awayTeam.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {summary.match.leagueRound ?? formatKickoff(summary.match.kickoff)} · {summary.match.venue ?? "Venue TBD"}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
          {getMinuteLabel(summary.match.status, summary.match.minute)}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="flex items-center gap-4">
          {summary.match.homeTeam.logo ? (
            <Image
              src={summary.match.homeTeam.logo}
              alt={summary.match.homeTeam.name}
              width={52}
              height={52}
              className="rounded-full bg-white"
            />
          ) : null}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Home</p>
            <p className="text-xl font-semibold">{summary.match.homeTeam.name}</p>
          </div>
        </div>
        <div className="text-center font-mono text-5xl font-semibold">
          {summary.match.score.home}
          <span className="mx-3 text-slate-500">:</span>
          {summary.match.score.away}
        </div>
        <div className="flex items-center justify-start gap-4 sm:justify-end">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Away</p>
            <p className="text-xl font-semibold">{summary.match.awayTeam.name}</p>
          </div>
          {summary.match.awayTeam.logo ? (
            <Image
              src={summary.match.awayTeam.logo}
              alt={summary.match.awayTeam.name}
              width={52}
              height={52}
              className="rounded-full bg-white"
            />
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-[#08121d] p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Timeline</p>
          <div className="mt-4 space-y-3">
            {summary.events.length ? (
              summary.events.map((event) => (
                <div key={event.id} className="flex gap-4 rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <div className="min-w-12 font-mono text-sm text-[var(--accent)]">{event.minute}&apos;</div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.type}</p>
                    <p className="text-sm text-slate-300">
                      {[event.player, event.detail].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No recent events available yet.</p>
            )}
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-white/10 bg-[#08121d] p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">Key stats</p>
          <div className="mt-4 space-y-3">
            {summary.stats.items.length ? (
              summary.stats.items.slice(0, 8).map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/6 bg-white/3 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-lg text-white">{item.home}</span>
                    <span className="text-sm text-[var(--muted)]">{item.label}</span>
                    <span className="font-mono text-lg text-white">{item.away}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No live statistics available yet.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
