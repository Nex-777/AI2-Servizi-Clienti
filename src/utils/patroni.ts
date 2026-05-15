import patroniData from '@/data/comuni_patroni.json'

export function getPatronoByComune(comune: string | null | undefined): string | null {
  if (!comune) return null
  
  const normalized = comune.toUpperCase().trim()
  
  // Direct match
  if ((patroniData as Record<string, string>)[normalized]) {
    return (patroniData as Record<string, string>)[normalized]
  }
  
  // Try to find if any key is contained within the string (or vice-versa)
  // Useful for "Ascoli Piceno (AP)" or similar
  const keys = Object.keys(patroniData)
  const foundKey = keys.find(key => normalized.includes(key) || key.includes(normalized))
  
  if (foundKey) {
    return (patroniData as Record<string, string>)[foundKey]
  }
  
  return null
}
