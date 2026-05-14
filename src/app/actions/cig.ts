'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function saveCigFase(foglioId: string, cantiereCod: string, fase: string, ticketInps: string = '') {
  if (!foglioId || !cantiereCod) {
    throw new Error('Dati mancanti per il salvataggio della domanda CIG.')
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('cig_fasi_lavorative')
    .upsert(
      {
        foglio_id: foglioId,
        cantiere_cod: cantiereCod,
        fase_lavorativa: fase.trim(),
        ticket_inps: ticketInps.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'foglio_id,cantiere_cod' }
    )
  if (error) throw new Error(`Errore salvataggio dati CIG: ${error.message}`)
  revalidatePath('/')
}

export async function getCigFasi(foglioId: string): Promise<{ cantiere_cod: string; fase_lavorativa: string; ticket_inps: string }[]> {
  if (!foglioId) return []
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cig_fasi_lavorative')
    .select('cantiere_cod, fase_lavorativa, ticket_inps')
    .eq('foglio_id', foglioId)
  if (error) return []
  return (data || []) as any
}

export async function saveFoglioNote(foglioId: string, note: string) {
  if (!foglioId) throw new Error('ID foglio mancante')
  const admin = createAdminClient()
  const { error } = await admin
    .from('fogli_presenza')
    .update({ note: note.trim() })
    .eq('id', foglioId)
  if (error) throw new Error(`Errore salvataggio note: ${error.message}`)
  revalidatePath('/')
}
