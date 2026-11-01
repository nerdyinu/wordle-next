import type { POST as GuessPOST } from "@/api/game/[hash]/guess/route";
import type { POST as CreatePOST } from "@/api/game/create/route";
import type { GET as PlayGET } from "@/api/game/play/[hash]/route";
import type { POST as StartPOST } from "@/api/game/start/route";
import type { NextResponse } from "next/server";
import { z } from "zod";
import type { GET as StatisticsGET } from "../api/statistics/route.ts";
import type { CreateBody, GuessBody } from "./schema.js";
import { GameState, Statistics } from "./types";
// The body a route handler responds with, read from the handler's own code (types only; nothing is imported at runtime).
type ResponseOf<H> = H extends (...args: never[]) => Promise<infer R> ? (R extends NextResponse<infer B> ? B : never) : never

export async function getStatistics(): Promise<Statistics> {
  const res = await fetch('/api/statistics')
  if (!res.ok) throw new Error('Failed to fetch statistics')
  const body: ResponseOf<typeof StatisticsGET> = await res.json()
  if ('error' in body) throw new Error('Failed to fetch statistics') // narrows the type; a 2xx never has `error`
  return body
}

export async function startGame(): Promise<string> {
  const res = await fetch('/api/game/start', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to start game')
  const data: ResponseOf<typeof StartPOST> = await res.json()

  console.log(data)
  return data.hash
}

export async function createGame(word: z.input<typeof CreateBody>['word']): Promise<string> {
  const res = await fetch('/api/game/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) throw new Error('Failed to create game')
  const data: ResponseOf<typeof CreatePOST> = await res.json()

  console.log(data)
  if ('error' in data) throw new Error('Failed to create game')
  return data.hash
}
// Client-side fetch function
export async function fetchGameState(hash: string): Promise<GameState> {
  const res = await fetch(`/api/game/play/${hash}`)
  if (!res.ok) throw new Error('Failed to fetch game state')
  const body: ResponseOf<typeof PlayGET> = await res.json()
  if ('error' in body) throw new Error('Failed to fetch game state')
  return body
}
export async function makeGuess(hash: string, guess: z.input<typeof GuessBody>['guess']): Promise<GameState> {
  const res = await fetch(`/api/game/${hash}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess }),
  })
  if (!res.ok) throw new Error('Failed to submit guess')
  const body: ResponseOf<typeof GuessPOST> = await res.json()
  if ('error' in body) throw new Error('Failed to submit guess')
  return body
}
