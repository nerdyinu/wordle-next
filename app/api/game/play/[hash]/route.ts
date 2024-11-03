import prisma from "@/lib/prisma"
import { decrypt } from "@/lib/wordEncryption"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, props: { params: Promise<{ hash: string }> }) {
  const params = await props.params;
  const gameId = decrypt(params.hash)
  const game = await prisma.game.findUnique({ where: { id: gameId } })

  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  return NextResponse.json(game)
}
