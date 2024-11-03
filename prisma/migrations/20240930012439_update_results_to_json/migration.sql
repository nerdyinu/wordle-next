/*
  Warnings:

  - You are about to drop the column `playTime` on the `Game` table. All the data in the column will be lost.
  - Changed the type of `results` on the `Game` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN "new_results" JSONB;

-- Step 2: Copy data from the old column to the new column
UPDATE "Game" SET "new_results" = COALESCE(
  (SELECT jsonb_agg(x) FROM unnest("results") AS x),
  '[]'::jsonb
);

-- Step 3: Drop the old column
ALTER TABLE "Game" DROP COLUMN "results";

-- Step 4: Rename the new column to the original name
ALTER TABLE "Game" RENAME COLUMN "new_results" TO "results";

-- Step 5: Set the new column as NOT NULL
ALTER TABLE "Game" ALTER COLUMN "results" SET NOT NULL;
