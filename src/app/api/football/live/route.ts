import { NextResponse } from "next/server";

import { normalizeScope } from "@/lib/feed-scope";
import { getLiveMatches } from "@/lib/football";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = await getLiveMatches(normalizeScope(url.searchParams.get("scope")));
  return NextResponse.json(data);
}
