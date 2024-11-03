/*
  Warnings:

  - You are about to drop the column `startedAt` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "startedAt",
ADD COLUMN     "results" TEXT[];
