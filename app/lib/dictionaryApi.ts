export type WordCheck = 'valid' | 'invalid' | 'unavailable'

export const DICTIONARY_UNAVAILABLE = 'Dictionary unavailable. Please try again later.'

export async function validateWord(word: string): Promise<WordCheck> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, { signal: AbortSignal.timeout(5000) })
    if (response.ok) return 'valid'
    if (response.status === 404) return 'invalid' // the API answers 404 for unknown words
    console.error('Dictionary API error:', response.status)
    return 'unavailable'
  } catch (error) {
    console.error('Error validating word:', error)
    return 'unavailable'
  }
}
