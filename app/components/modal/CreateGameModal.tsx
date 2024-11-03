'use client'

import { createGame } from "@/lib/api"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import router from "next/router"
import { useState } from "react"
interface CreateGameModalProps {
  onModalClose: { onClose: () => void; };
}

export default function CreateGameModal({ onModalClose: { onClose } }: CreateGameModalProps) {
  const [word, setWord] = useState('')
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null)


  const createGameMutation = useMutation<string, Error, string>({
    onSuccess: (hash) => {
      console.log("success", hash)
      router.push(`/game/${encodeURIComponent(hash)}`)
      onClose()
    },
    onError: () => { console.log("fail?"); setError('Failed to create game. Please try again.') },
    mutationFn: (word) => createGame(word)
  }, queryClient)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (word.length === 5) {
      createGameMutation.mutate(word.toUpperCase())
    }
  }
  return (
    (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">워들 생성하기</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                maxLength={5}
                placeholder="5글자 단어 입력"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-red-500">{error}</p>}
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={word.length !== 5}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  )
}
