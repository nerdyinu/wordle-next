import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/wordEncryption'
import { NextResponse } from 'next/server'

export async function POST() {
  const fixedWord = 'WORLD'
  const encryptedWord = encrypt(fixedWord)
  const game = await prisma.game.create({
    data: {
      word: encryptedWord,
    }
  })
  const gameHash = encrypt(game.id)
  return NextResponse.json({ hash: gameHash })
}

// Similar implementations for create, [hash], and [hash]/guess routes
