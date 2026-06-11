import postgres from "postgres";

import { getConfig } from "@/lib/config";
import { ConversationContext, ConversationLog } from "@/lib/types";

const contextMap = new Map<string, ConversationContext>();
const recentLogCache: ConversationLog[] = [];

let sqlClient: postgres.Sql | null = null;
let initialized = false;
let dbDisabled = false;

function getSql() {
  if (dbDisabled) {
    return null;
  }

  const config = getConfig();
  if (!config.DATABASE_URL) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = postgres(config.DATABASE_URL, {
      max: 1,
      prepare: false,
    });
  }

  return sqlClient;
}

async function ensureTable() {
  const sql = getSql();
  if (!sql || initialized) {
    return;
  }

  try {
    await sql`
      create table if not exists conversation_logs (
        id text primary key,
        channel text not null,
        session_id text not null,
        match_id integer,
        user_message text not null,
        assistant_message text not null,
        language text not null,
        provider text not null,
        error text,
        latency_ms integer,
        created_at timestamptz not null default now()
      )
    `;

    initialized = true;
  } catch {
    dbDisabled = true;
    sqlClient = null;
  }
}

function contextKey(channel: string, sessionId: string) {
  return `${channel}:${sessionId}`;
}

export async function getConversationContext(channel: string, sessionId: string) {
  return contextMap.get(contextKey(channel, sessionId)) ?? null;
}

export async function updateConversationContext(context: ConversationContext) {
  contextMap.set(contextKey(context.channel, context.sessionId), context);
}

export async function appendConversationLog(log: ConversationLog) {
  recentLogCache.unshift(log);
  recentLogCache.splice(20);

  await ensureTable();
  const sql = getSql();
  if (!sql) {
    return;
  }

  try {
    await sql`
      insert into conversation_logs (
        id,
        channel,
        session_id,
        match_id,
        user_message,
        assistant_message,
        language,
        provider,
        error,
        latency_ms,
        created_at
      ) values (
        ${log.id},
        ${log.channel},
        ${log.sessionId},
        ${log.matchId ?? null},
        ${log.userMessage},
        ${log.assistantMessage},
        ${log.language},
        ${log.provider},
        ${log.error ?? null},
        ${log.latencyMs ?? null},
        ${log.createdAt}
      )
    `;
  } catch {
    dbDisabled = true;
    sqlClient = null;
  }
}

export async function getRecentLogs() {
  return recentLogCache;
}
