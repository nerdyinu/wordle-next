import { z } from 'zod';

// Request bodies of the create and guess routes. The routes check them at runtime;
// the client takes its argument types from them (app/lib/api.ts).
// word.length counts UTF-16 units, as the route and the create modal do today; zod's .length(5) would count code points.
export const CreateBody = z.object({ word: z.string().refine((word) => word.length === 5) })

export const GuessBody = z.object({
  guess: z.string().regex(/^[A-Za-z]{5}$/).transform((guess) => guess.toUpperCase()),
});

