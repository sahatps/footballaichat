import Image from "next/image";

import { StandingRow } from "@/lib/types";

export function StandingsTable({
  rows,
  title = "Premier League snapshot",
}: {
  rows: StandingRow[];
  title?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-strong)]">Table</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
          Live-ready
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-[var(--muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Pts</th>
              <th className="px-4 py-3 font-medium">P</th>
              <th className="px-4 py-3 font-medium">GD</th>
              <th className="px-4 py-3 font-medium">Form</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 8).map((row) => (
              <tr key={row.team.id} className="border-t border-white/6">
                <td className="px-4 py-3 font-mono text-slate-300">{row.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {row.team.logo ? (
                      <Image src={row.team.logo} alt={row.team.name} width={24} height={24} className="rounded-full bg-white" />
                    ) : null}
                    <span>{row.team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{row.points}</td>
                <td className="px-4 py-3 text-slate-300">{row.played}</td>
                <td className="px-4 py-3 text-slate-300">{row.goalsDiff}</td>
                <td className="px-4 py-3 font-mono text-xs tracking-[0.2em] text-[var(--accent)]">{row.form ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
