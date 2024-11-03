export async function validateWord(word: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    return response.ok
  } catch (error) {
    console.error('Error validating word:', error)
    return false
  }
}
