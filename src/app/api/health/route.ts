import { NextResponse } from "next/server";

import { getConfig } from "@/lib/config";
import { getRecentLogs } from "@/lib/store";

export async function GET() {
  const config = getConfig();
  const logs = await getRecentLogs();

  return NextResponse.json({
    ok: true,
    services: {
      apiFootball: Boolean(config.API_FOOTBALL_KEY),
      zai: Boolean(config.ZAI_API_KEY),
      line: Boolean(config.LINE_CHANNEL_ACCESS_TOKEN && config.LINE_CHANNEL_SECRET),
      database: Boolean(config.DATABASE_URL),
    },
    recentLogCount: logs.length,
  });
}
