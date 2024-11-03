import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const stats = await prisma.gameStatistics.findFirst()

  if (!stats) {
    return NextResponse.json({ error: 'Statistics not found' }, { status: 404 })
  }

  const winRate = stats.totalGames > 0
    ? (stats.totalVictories / stats.totalGames) * 100
    : 0

  const distribution = stats.guessCounts.reduce((acc: Record<number, number>, count: number) => {
    acc[count] = (acc[count] || 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    totalGames: stats.totalGames,
    totalVictories: stats.totalVictories,
    winRate: winRate.toFixed(2),
    guessDistribution: distribution
  })
}
