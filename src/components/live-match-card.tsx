import Image from "next/image";
import Link from "next/link";

import { LiveMatch } from "@/lib/types";
import { formatKickoff, getMinuteLabel, isLiveStatus } from "@/lib/utils";

export function LiveMatchCard({ match }: { match: LiveMatch }) {
  return (
    <Link
      href={`/match/${match.id}`}
      className="group rounded-[1.75rem] border border-white/10 bg-[var(--card)] p-5 transition hover:-translate-y-1 hover:border-[var(--accent-strong)]"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">{match.leagueName}</p>
          <p className="mt-2 text-sm text-slate-300">{match.leagueRound ?? formatKickoff(match.kickoff)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isLiveStatus(match.status)
              ? "bg-[rgba(150,255,102,0.14)] text-[var(--accent)]"
              : "bg-white/8 text-slate-200"
          }`}
        >
          {getMinuteLabel(match.status, match.minute)}
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        {[match.homeTeam, match.awayTeam].map((team, index) => (
          <div key={team.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {team.logo ? (
                <Image src={team.logo} alt={team.name} width={30} height={30} className="rounded-full bg-white/95" />
              ) : (
                <div className="h-[30px] w-[30px] rounded-full bg-white/10" />
              )}
              <span className="text-base font-medium">{team.name}</span>
            </div>
            <span className="font-mono text-2xl font-semibold">
              {index === 0 ? match.score.home : match.score.away}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between text-sm text-[var(--muted)]">
        <span>{match.venue ?? "Venue TBD"}</span>
        <span className="transition group-hover:text-white">Open analysis</span>
      </div>
    </Link>
  );
}
