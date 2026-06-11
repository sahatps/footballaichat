import { fireEvent, render, screen } from "@testing-library/react";

import { DashboardShell } from "@/components/dashboard-shell";
import {
  mockLiveMatches,
  mockStandings,
  mockWorldCupLiveMatches,
  mockWorldCupStandings,
} from "@/lib/mock-data";

describe("DashboardShell", () => {
  it("switches between world cup and all live matches", () => {
    render(
      <DashboardShell
        feeds={{
          "world-cup": {
            matches: mockWorldCupLiveMatches,
            source: "mock",
            scope: "world-cup",
            label: "FIFA World Cup 2026",
          },
          "all-live": {
            matches: mockLiveMatches,
            source: "mock",
            scope: "all-live",
            label: "All Live Matches",
          },
        }}
        standingsByScope={{
          "world-cup": {
            rows: mockWorldCupStandings,
            source: "mock",
            label: "World Cup Group A",
          },
          "all-live": {
            rows: mockStandings,
            source: "mock",
            label: "Premier League snapshot",
          },
        }}
      />,
    );

    expect(screen.getAllByText("FIFA World Cup 2026").length).toBeGreaterThan(0);
    expect(screen.getByText("Mexico vs South Africa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All Live Matches" }));

    expect(screen.getByText("Manchester City vs Liverpool")).toBeInTheDocument();
    expect(screen.getAllByText("All Live Matches")[0]).toBeInTheDocument();
  });
});
