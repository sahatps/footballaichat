import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatPanel } from "@/components/chat-panel";
import { MatchDetail } from "@/components/match-detail";
import { getMatchSummary } from "@/lib/football";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  const summary = await getMatchSummary(matchId);

  if (!summary) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-[var(--accent-strong)]">
          Back to dashboard
        </Link>
        <span className="text-sm text-[var(--muted)]">Shared AI context enabled</span>
      </div>
      <MatchDetail summary={summary} />
      <ChatPanel selectedMatch={summary.match} />
    </main>
  );
}
