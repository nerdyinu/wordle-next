'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchGameState, makeGuess } from '../lib/api';
import { GameState } from '../lib/types';
import GameBoard from './GameBoard';
import Keyboard from './KeyBoard';
import Loader from './Loader';
import ResultModal from './modal/ResultModal';

export default function Game({ gameHash }: { gameHash: string }) {
  const [currentGuess, setCurrentGuess] = useState('')
  const [showResultModal, setShowResultModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: gameState, isPending } = useQuery<GameState, Error>(
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
        // The guess route returns the same GameState shape, so write it straight into the cache
        // instead of refetching: completedAt is there the moment the result modal opens.
        queryClient.setQueryData(['gameState', gameHash], updatedGameState)
        queryClient.invalidateQueries({ queryKey: ['statistics'] })
        if (updatedGameState.isCompleted) {
          setCurrentGuess('') // letters typed while the finishing guess was pending can't be sent any more
          setShowResultModal(true)
        }
      },
    }, queryClient
  )

  const handleKeyPress = async (key: string) => {
    if (gameState?.isCompleted) return
    if (key === 'ENTER') {
      // Submit only a full guess, and only one at a time: a second guess sent while the first is pending
      // could be stored before it.
      if (currentGuess.length === 5 && !guessMutation.isPending) {
        guessMutation.mutate(currentGuess)
        setCurrentGuess('')
      }
    }
    else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1))
    } else if (currentGuess.length < 5) {
      setCurrentGuess(prev => prev + key)
    }
  }


  const playTime = gameState?.completedAt
    ? Math.round((Date.parse(gameState.completedAt) - Date.parse(gameState.createdAt)) / 1000)
    : 0
  if (isPending) return <Loader />;
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
