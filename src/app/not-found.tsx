import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.34em] text-[var(--accent)]">404</p>
      <h1 className="mt-4 text-4xl font-semibold">Match not found</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--muted)]">
        The requested fixture is unavailable in the current live feed or mock dataset.
      </p>
      <Link href="/" className="mt-8 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-slate-950">
        Return to dashboard
      </Link>
    </main>
  );
}
