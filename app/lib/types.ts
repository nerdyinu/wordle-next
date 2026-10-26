export type GuessResult = ('correct' | 'present' | 'absent')[];

export interface GameState {
  id: string;
  guesses: string[];
  results: GuessResult[];
  isCompleted: boolean;
  isVictory: boolean;
  createdAt: string;           // ISO string: it travels as JSON
  completedAt: string | null;
}

export interface Statistics {
  totalGames: number;
  totalVictories: number;
  winRate: string;
  guessDistribution: Record<number, number>;
}
