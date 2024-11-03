import { GameState, Statistics } from "./types"
export async function fetchStatistics(): Promise<Statistics> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/statistics`)
  if (!res.ok) throw new Error('Failed to fetch statistics')
  return res.json()
}


export async function getStatistics(): Promise<Statistics> {
  const res = await fetch('/api/statistics')
  if (!res.ok) throw new Error('Failed to fetch statistics')
  return res.json()
}

export async function startGame(): Promise<string> {
  const res = await fetch('/api/game/start', { method: 'POST' })
  if (!res.ok) throw new Error('Failed to start game')
  const data = await res.json()

  console.log(data)
  return data.hash
}

export async function createGame(word: string): Promise<string> {
  const res = await fetch('/api/game/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  })
  if (!res.ok) throw new Error('Failed to create game')
  const data = await res.json()

  console.log(data)
  return data.hash
}

export async function getGameState(hash: string): Promise<GameState> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${hash}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch game state')
  return res.json()
}

// Client-side fetch function
export async function fetchGameState(hash: string): Promise<GameState> {
  const res = await fetch(`/api/game/${hash}`)
  if (!res.ok) throw new Error('Failed to fetch game state')
  return res.json()
}
export async function makeGuess(hash: string, guess: string): Promise<GameState> {
  const res = await fetch(`/api/game/${hash}/guess`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guess }),
  })
  if (!res.ok) throw new Error('Failed to submit guess')
  return res.json()
}
