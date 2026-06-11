import { DashboardShell } from "@/components/dashboard-shell";
import { getLiveMatches, getStandingsForScope } from "@/lib/football";

export default async function HomePage() {
  const worldCupLive = await getLiveMatches("world-cup");
  const allLive = await getLiveMatches("all-live");
  const [worldCupStandings, allLiveStandings] = await Promise.all([
    getStandingsForScope("world-cup", worldCupLive.matches),
    getStandingsForScope("all-live", allLive.matches),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <DashboardShell
        feeds={{
          "world-cup": worldCupLive,
          "all-live": allLive,
        }}
        standingsByScope={{
          "world-cup": worldCupStandings,
          "all-live": allLiveStandings,
        }}
      />
    </main>
  );
}
