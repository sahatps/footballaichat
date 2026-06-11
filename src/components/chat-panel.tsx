"use client";

import { useState } from "react";

import { createTimeoutSignal } from "@/lib/timeout";
import { ChatResponse, LiveMatch } from "@/lib/types";
import { cn } from "@/lib/utils";

type ChatPanelProps = {
  selectedMatch?: LiveMatch;
};

type ChatApiError = {
  error?: string;
};

const presets = [
  "Match summary",
  "Which team has the advantage?",
  "Report the last 10 minutes",
  "สรุปเกมตอนนี้",
];

const CLIENT_TIMEOUT_MS = 15000;

export function ChatPanel({ selectedMatch }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sessionId = "web-demo-session";

  const submit = async (nextMessage: string) => {
    setIsSending(true);
    setError(null);
    setResponse(null);

    const { signal, cancel } = createTimeoutSignal(CLIENT_TIMEOUT_MS);

    try {
      const result = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
        body: JSON.stringify({
          message: nextMessage,
          sessionId,
          matchId: selectedMatch?.id,
        }),
      });

      if (!result.ok) {
        const failure = ((await result.json().catch(() => null)) ?? {}) as ChatApiError;
        throw new Error(failure.error ?? "Unable to reach chat service");
      }

      const data = (await result.json()) as ChatResponse;
      setResponse(data);
      setMessage("");
    } catch (submitError) {
      console.error("Chat submission failed", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to send the message right now.",
      );
    } finally {
      cancel();
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[var(--card)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent)]">Shared AI</p>
          <h2 className="mt-2 text-2xl font-semibold">Ask for a match report</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--muted)]">
          {selectedMatch
            ? `${selectedMatch.homeTeam.name} vs ${selectedMatch.awayTeam.name}`
            : "Select a match"}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            disabled={isSending}
            onClick={() => void submit(preset)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition hover:border-[var(--accent)] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {preset}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <textarea
          id="chat-message"
          name="chat-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              if (!message.trim() || isSending) {
                return;
              }
              void submit(message.trim());
            }
          }}
          placeholder="Ask for summary, momentum, or key events..."
          className="min-h-28 w-full rounded-[1.5rem] border border-white/10 bg-[#0d1826] px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-[var(--accent-strong)]"
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--muted)]">
            {isSending
              ? "Sending your message and waiting for the analysis..."
              : "Web chat and LINE bot share the same prompt pipeline."}
          </p>
          <button
            type="button"
            disabled={isSending}
            onClick={() => {
              if (!message.trim() || isSending) {
                return;
              }
              void submit(message.trim());
            }}
            className={cn(
              "rounded-full px-5 py-2.5 text-sm font-medium text-slate-950 transition disabled:cursor-not-allowed disabled:opacity-60",
              isSending ? "bg-slate-500" : "bg-[var(--accent)] hover:brightness-110",
            )}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <div
        aria-live="polite"
        className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#08121d] p-4"
      >
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Response</p>
        {isSending ? (
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Analyzing the latest match state and generating a reply...
          </p>
        ) : error ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
        ) : response ? (
          <div className="mt-3 space-y-3">
            <p className="text-sm leading-7 text-slate-100">{response.answer}</p>
            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              <span className="rounded-full border border-white/10 px-2 py-1">
                {response.source === "ai" ? "z.ai" : "fallback"}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-1">
                {response.language.toUpperCase()}
              </span>
              {response.match ? (
                <span className="rounded-full border border-white/10 px-2 py-1">
                  {response.match.leagueName}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Ask for a quick summary, recent key events, or which side looks more in control.
          </p>
        )}
      </div>
    </section>
  );
}
