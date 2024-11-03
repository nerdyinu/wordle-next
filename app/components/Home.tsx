// components/HomeComponent.tsx
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { startGame } from '../lib/api'
import CreateGameModal from './modal/CreateGameModal'

export default function Home() {
  const [word, setWord] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient();

  const startGameMutation = useMutation<string, Error>({
    onSuccess: (hash) => router.push(`/game/${encodeURIComponent(hash)}`),
    onError: () => setError('Failed to start game. Please try again.'),
    mutationFn: () => startGame()
  }, queryClient)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Wordle Game</h1>
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <button
            onClick={() => startGameMutation.mutate()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded w-full"
          >
            시작하기
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
          >
            워들 생성하기
          </button>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
      {showCreateModal && (
        <CreateGameModal onModalClose={{ onClose: () => setShowCreateModal(false) }} />)
      }
    </div>
  )
}

