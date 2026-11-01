import { DICTIONARY_UNAVAILABLE, validateWord } from '@/lib/dictionaryApi';
import prisma from '@/lib/prisma';
import { CreateBody } from '@/lib/schema';
import { encrypt } from '@/lib/wordEncryption';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const parsed = CreateBody.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }
  const { word } = parsed.data
  const wordCheck = await validateWord(word)
  if (wordCheck === 'unavailable') {
    return NextResponse.json({ error: DICTIONARY_UNAVAILABLE }, { status: 503 })
  }
  if (wordCheck === 'invalid') {
    return NextResponse.json({ error: 'Invalid word' }, { status: 400 })
  }
  const encryptedWord = encrypt(word.toUpperCase())
  const game = await prisma.game.create({
    data: { word: encryptedWord }
  })
  const gameHash = encrypt(game.id)
  return NextResponse.json({ hash: gameHash })
}

