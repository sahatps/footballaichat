import { NextResponse } from "next/server";

import { getStandings } from "@/lib/football";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const league = Number(url.searchParams.get("league") ?? "39");
  const season = Number(url.searchParams.get("season") ?? `${new Date().getUTCFullYear() - 1}`);
  const data = await getStandings(league, season);
  return NextResponse.json(data);
}
