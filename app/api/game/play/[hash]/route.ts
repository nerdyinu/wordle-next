import { getGameView } from "@/lib/game.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, props: { params: Promise<{ hash: string }> }) {
  const { hash } = await props.params;
  const game = await getGameView(hash);

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  return NextResponse.json(game)
}
