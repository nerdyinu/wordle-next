-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "guesses" TEXT[],
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isVictory" BOOLEAN NOT NULL DEFAULT false,
    "playTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameStatistics" (
    "id" SERIAL NOT NULL,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalVictories" INTEGER NOT NULL DEFAULT 0,
    "guessCounts" INTEGER[],

    CONSTRAINT "GameStatistics_pkey" PRIMARY KEY ("id")
);
