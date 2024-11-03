import { validateWord } from '@/lib/dictionaryApi'
import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/wordEncryption'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { word } = await request.json()
  if (word.length !== 5 || !(await validateWord(word))) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }
  const encryptedWord = encrypt(word.toUpperCase())
  const game = await prisma.game.create({
    data: { word: encryptedWord }
  })
  const gameHash = encrypt(game.id)
  return NextResponse.json({ hash: gameHash })
}

