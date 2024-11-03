import { GuessResult } from "./types"

export function evaluateGuess(guess: string, answer: string): GuessResult {
  const result: GuessResult = Array(5).fill('absent')
  const answerArray = answer.split('')
  const guessArray = guess.split('')

  for (let i = 0; i < 5; i++) {
    if (guessArray[i] === answerArray[i]) {
      result[i] = 'correct'
      answerArray[i] = '*' // Mark as used
      guessArray[i] = '-' // Mark as processed
    }
  }

  for (let i = 0; i < 5; i++) {
    if (guessArray[i] !== '-') {
      const index = answerArray.indexOf(guessArray[i])
      if (index !== -1) {
        result[i] = 'present'
        answerArray[index] = '*' // Mark as used
      }
    }
  }

  return result
}
