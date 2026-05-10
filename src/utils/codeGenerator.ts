import { createAdminClient } from '@/utils/supabase/admin'

export async function generateAndAssignCantiereCode(clientId: string): Promise<string | null> {
  const admin = createAdminClient()
  
  // 1. Get profile
  const { data: profile } = await admin
    .from('profiles')
    .select('is_edile, lettera_identificativa')
    .eq('id', clientId)
    .single()
    
  if (!profile || !profile.is_edile || !profile.lettera_identificativa) {
    return null; // Not an edile client, or no letter assigned
  }
  
  const letter = profile.lettera_identificativa.toUpperCase().trim()
  
  // 2. Get latest cantiere for this letter
  const { data: latestCantieri } = await admin
    .from('cantieri')
    .select('cod')
    .eq('client_id', clientId)
    .ilike('cod', `${letter}%`)
    .order('created_at', { ascending: false })
    .limit(1)
    
  let nextNum = 1
  if (latestCantieri && latestCantieri.length > 0 && latestCantieri[0].cod) {
    const latestCod = latestCantieri[0].cod
    const match = latestCod.match(new RegExp(`^${letter}(\\d+)`, 'i'))
    if (match && match[1]) {
      const lastNum = parseInt(match[1], 10)
      nextNum = lastNum + 1
      if (nextNum > 99) nextNum = 1
    }
  }
  
  const targetCode = `${letter}${nextNum.toString().padStart(2, '0')}`
  
  // 3. Archive existing cantiere with the exact same code if it exists
  const { data: conflict } = await admin
    .from('cantieri')
    .select('id')
    .eq('client_id', clientId)
    .eq('cod', targetCode)
    .single()
    
  if (conflict) {
    // Generate a unique archive code. We use a short random string or timestamp.
    const archiveCode = `${targetCode}-ARCHIVIATO-${Math.floor(Date.now() / 1000)}`
    await admin
      .from('cantieri')
      .update({ cod: archiveCode })
      .eq('id', conflict.id)
  }
  
  return targetCode
}
