import { DICTIONARY_UNAVAILABLE, validateWord } from "@/lib/dictionaryApi";
import { gameViewSelect, safeDecrypt, toGameState } from "@/lib/game.service";
import { evaluateGuess } from "@/lib/gameLogic";
import prisma from "@/lib/prisma";
import { GuessBody } from "@/lib/schema";
import { decrypt } from "@/lib/wordEncryption";
import { PrismaClient } from "@prisma/client/extension";
import { JsonArray } from "@prisma/client/runtime/library";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest, props: { params: Promise<{ hash: string }> }) {
  const params = await props.params;
  const gameId = safeDecrypt(params.hash)
  if (!gameId) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  if (body === null) {
    // Where the old code threw (a body that isn't JSON, or is null): answered at the same point, now with a 400.
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }


  const game = await prisma.game.findUnique({ where: { id: gameId } })
  if (!game) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  if (game.isCompleted) {
    return NextResponse.json({ error: 'Game already completed' }, { status: 400 })
  }
  const parsed = GuessBody.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }
  const { guess } = parsed.data
  const guessCheck = await validateWord(guess)
  if (guessCheck === 'unavailable') {
    return NextResponse.json({ error: DICTIONARY_UNAVAILABLE }, { status: 503 })
  }
  if (guessCheck === 'invalid') {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }

  const word = decrypt(game.word)
  const result = evaluateGuess(guess, word)

  // Lock the game row until this transaction ends. A second guess for the same game waits at the
  // SELECT ... FOR UPDATE, then reads the game including the first guess instead of overwriting it.
  const updatedGame = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM "Game" WHERE "id" = ${gameId} FOR UPDATE`
    const current = await tx.game.findUniqueOrThrow({ where: { id: gameId } })
    if (current.isCompleted) {
      return null // a guess that held the lock before this one finished the game
    }

    const updatedGuesses = [...current.guesses, guess]
    const updatedResults = [...current.results, result] as JsonArray[]
    const isVictory = guess === word
    const isCompleted = isVictory || updatedGuesses.length >= 6

    return tx.game.update({
      where: { id: gameId },
      data: {
        guesses: updatedGuesses,
        results: updatedResults,
        isCompleted,
        isVictory,
        completedAt: isCompleted ? new Date() : undefined
      },
      select: gameViewSelect
    })
  })
  if (!updatedGame) {
    return NextResponse.json({ error: 'Game already completed' }, { status: 400 })
  }

  if (updatedGame.isCompleted) {
    await updateStatistics(prisma, updatedGame.isVictory, updatedGame.guesses.length)
  }


  return NextResponse.json(toGameState(updatedGame))
}

async function updateStatistics(prisma: PrismaClient, isVictory: boolean, guessCount: number) {
  await prisma.gameStatistics.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      totalGames: 1,
      totalVictories: isVictory ? 1 : 0,
      guessCounts: [guessCount]
    },
    update: {
      totalGames: { increment: 1 },
      totalVictories: isVictory ? { increment: 1 } : undefined,
      guessCounts: { push: guessCount }
    }
  })
}

