import { validateWord } from "@/lib/dictionaryApi"
import { evaluateGuess } from "@/lib/gameLogic"
import prisma from "@/lib/prisma"
import { decrypt } from "@/lib/wordEncryption"
import { PrismaClient } from "@prisma/client/extension"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, props: { params: Promise<{ hash: string }> }) {
  const params = await props.params;
  const gameId = decrypt(params.hash)
  const { guess } = await request.json()

  const game = await prisma.game.findUnique({ where: { id: gameId } })
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  if (game.isCompleted) {
    return NextResponse.json({ error: 'Game already completed' }, { status: 400 })
  }

  if (!(await validateWord(guess))) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }

  const word = decrypt(game.word)
  const result = evaluateGuess(guess, word)
  const updatedGuesses = [...game.guesses, guess]
  const updatedResults = [...game.results, result]
  const isVictory = guess === word
  const isCompleted = isVictory || updatedGuesses.length >= 6

  const updatedGame = await prisma.game.update({
    where: { id: gameId },
    data: {
      guesses: updatedGuesses,
      results: updatedResults,
      isCompleted,
      isVictory,
      completedAt: isCompleted ? new Date() : undefined
    }
  })

  if (isCompleted) {
    await updateStatistics(prisma, isVictory, updatedGuesses.length)
  }


  return NextResponse.json(updatedGame)
}

async function updateStatistics(prisma: PrismaClient, isVictory: boolean, guessCount: number) {
  const stats = await prisma.gameStatistics.findFirst()

  if (stats) {
    await prisma.gameStatistics.update({
      where: { id: stats.id },
      data: {
        totalGames: { increment: 1 },
        totalVictories: isVictory ? { increment: 1 } : undefined,
        guessCounts: { push: guessCount }
      }
    })
  } else {
    await prisma.gameStatistics.create({
      data: {
        totalGames: 1,
        totalVictories: isVictory ? 1 : 0,
        guessCounts: [guessCount]
      }
    })
  }
}

