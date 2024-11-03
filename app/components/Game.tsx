'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { fetchGameState, makeGuess } from '../lib/api'
import { GameState } from '../lib/types'
import GameBoard from './GameBoard'
import Keyboard from './KeyBoard'
import ResultModal from './modal/ResultModal'

export default function Game({ gameHash }: { gameHash: string }) {
  const [currentGuess, setCurrentGuess] = useState('')
  const [showResultModal, setShowResultModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: gameState } = useQuery<GameState, Error>(
    {
      queryKey: ['gameState', gameHash],
      queryFn: () => fetchGameState(gameHash!),
      enabled: !!gameHash,
      staleTime: Infinity,
    },
    queryClient,
  )


  const guessMutation = useMutation<GameState, Error, string>(
    {
      mutationFn: (guess: string) => makeGuess(gameHash, guess),
      onSuccess: (updatedGameState) => {
        queryClient.invalidateQueries({ queryKey: ['gameState', gameHash] })
        if (updatedGameState.isCompleted) {
          setShowResultModal(true)
        }
      },
    }, queryClient
  )

  const handleKeyPress = async (key: string) => {
    if (gameState?.isCompleted) return
    if (key === 'ENTER' && currentGuess.length === 5) {
      guessMutation.mutate(currentGuess)
      setCurrentGuess('')
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key)
    }
  }

  const playTime = useMemo(() => {
    if (gameState?.startTime) return Math.round((new Date().getTime() - new Date(gameState.startTime).getTime()) / 1000)
    else return 0
  }, [gameState?.startTime]);

  if (!gameState) return <div className="text-center text-xl mt-8">No game found</div>;

  return (
    <div className="flex flex-col items-center mt-8">
      <GameBoard
        guesses={gameState.guesses}
        results={gameState.results}
        currentGuess={currentGuess}
      />
      {guessMutation.isError && (
        <p className="text-red-500 mt-4">Error submitting guess. Please try again.</p>
      )}
      <div className="mt-8">
        <Keyboard handleKeyPress={{ onKeyPress: handleKeyPress }} usedLetters={gameState.guesses.join('')} />
      </div>
      {showResultModal && (
        <ResultModal
          isVictory={gameState.isVictory}
          playTime={playTime}
          handleOnClose={{ onClose: () => setShowResultModal(false) }}
        />
      )}
    </div>
  )
}
