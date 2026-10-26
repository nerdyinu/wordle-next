import prisma from '@/lib/prisma';
import type { GameState, GuessResult } from '@/lib/types';
import { decrypt } from '@/lib/wordEncryption';
import type { Prisma } from '@prisma/client';
import 'server-only';

export function safeDecrypt(hash: string): string | null {
  try {
    return decrypt(hash);
  } catch {
    return null;              // malformed link, or a link made before the last restart (fix 4)
  }
}

// The fields the screen needs. The query and the row type both come from this one object.
export const gameViewSelect = {
  id: true, guesses: true, results: true, isCompleted: true,
  isVictory: true, createdAt: true, completedAt: true,
} satisfies Prisma.GameSelect;

type GameRow = Prisma.GameGetPayload<{ select: typeof gameViewSelect }>;

// One response shape for SSR and for the API. No `word`; dates as ISO strings (fixes 5, 6).
export function toGameState(g: GameRow): GameState {
  return {
    id: g.id,
    guesses: g.guesses,
    results: g.results as GuessResult[],
    isCompleted: g.isCompleted,
    isVictory: g.isVictory,
    createdAt: g.createdAt.toISOString(),
    completedAt: g.completedAt?.toISOString() ?? null,
  };
}

export async function getGameView(hash: string): Promise<GameState | null> {
  const id = safeDecrypt(hash);
  if (!id) return null;
  const game = await prisma.game.findUnique({
    where: { id },
    select: gameViewSelect,
  });
  return game ? toGameState(game) : null;
}
