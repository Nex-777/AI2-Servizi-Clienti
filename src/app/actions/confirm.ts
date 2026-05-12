'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { buildGisCsv } from '@/utils/csv-parser'
import { resend } from '@/utils/resend'
import { revalidatePath } from 'next/cache'

const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

// Called when client clicks "Conferma e Invia"
export async function confirmAndSend(foglioId: string) {
  console.log(`[confirmAndSend] Avvio per foglioId: ${foglioId}`)
  const admin = createAdminClient()

  // 1. Fetch foglio + client info
  const { data: foglio, error: foglioError } = await admin
    .from('fogli_presenza')
    .select('*, profiles(ragione_sociale)')
    .eq('id', foglioId)
    .single()

  if (foglioError || !foglio) throw new Error('Foglio non trovato')

  // 2. Fetch dipendenti
  const { data: dipendenti } = await admin
    .from('dipendenti')
    .select('*')
    .eq('foglio_id', foglioId)

  if (!dipendenti?.length) {
    console.error(`[confirmAndSend] Nessun dipendente trovato per foglioId: ${foglioId}`)
    throw new Error('Nessun dipendente trovato')
  }

  console.log(`[confirmAndSend] Elaborazione dati per ${dipendenti.length} dipendenti`)

  // 3. Fetch giornate + causali per ogni dipendente
  const dipendentiConDati = await Promise.all(
    dipendenti.map(async (dip) => {
      const { data: giornate } = await admin
        .from('giornate')
        .select('*')
        .eq('dipendente_id', dip.id)

      const { data: causali } = await admin
        .from('causali')
        .select('*')
        .eq('dipendente_id', dip.id)

      // Build giorni map
      const giorni: Record<number, {
        oreLavorate: number | null
        ore_contrattuali: number | null
        oreNotturne: number | null
        turno: string | null
        causali: Array<{ numero: number; codice: string | null; ore: number | null }>
      }> = {}

      for (let g = 1; g <= 31; g++) {
        const giornata = giornate?.find(x => x.giorno === g)
        const causaliGiorno = causali?.filter(c => c.giorno === g) || []

        giorni[g] = {
          oreLavorate: giornata?.ore_lavorate ?? null,
          ore_contrattuali: giornata?.ore_contrattuali ?? null,
          oreNotturne: giornata?.ore_notturne ?? null,
          turno: giornata?.turno ?? null,
          causali: [1, 2, 3, 4, 5].map(n => {
            const c = causaliGiorno.find(x => x.numero === n)
            return { numero: n, codice: c?.codice ?? null, ore: c?.ore ?? null }
          }),
        }
      }

      return {
        matricola: dip.matricola,
        cognomeNome: dip.cognome_nome,
        giorni,
      }
    })
  )

  // 4. Build CSV
  const csvContent = buildGisCsv({
    azienda: foglio.azienda,
    sede: foglio.sede || '',
    anno: foglio.anno,
    mese: foglio.mese,
    dipendenti: dipendentiConDati,
  })

  // 5. Send email via Resend
  const nomeMese = MESI[foglio.mese] || `Mese${foglio.mese}`
  const clientName = (foglio as any).profiles?.ragione_sociale || foglio.azienda
  const filename = `presenze_${clientName.replace(/\s+/g, '_')}_${nomeMese}_${foglio.anno}.csv`

  const { error: emailError } = await resend.emails.send({
    from: 'AI2 Servizi Clienti <notifiche@agenziaitalia2.it>',
    to: [process.env.ADMIN_EMAIL || 'paoletti@agenziaitalia2.it'],
    subject: `Foglio Presenze - ${nomeMese} ${foglio.anno} - ${clientName}`,
    html: `
      <p>Il cliente ha confermato il foglio presenze.</p>
      <ul>
        <li><strong>Azienda:</strong> ${clientName}</li>
        <li><strong>Periodo:</strong> ${nomeMese} ${foglio.anno}</li>
        <li><strong>Dipendenti:</strong> ${dipendentiConDati.length}</li>
      </ul>
      <p>Il file CSV è allegato a questa email.</p>
    `,
    attachments: [
      {
        filename,
        content: Buffer.from(csvContent, 'utf-8').toString('base64'),
        contentType: 'text/csv',
      },
    ],
  })

  if (emailError) {
    console.error(`[confirmAndSend] Errore Resend:`, emailError)
    throw new Error(`Errore invio email: ${emailError.message}`)
  }

  console.log(`[confirmAndSend] Email inviata con successo. Aggiornamento stato foglio...`)

  // 6. Update status to confermato
  await admin
    .from('fogli_presenza')
    .update({ status: 'confermato', confirmed_at: new Date().toISOString() })
    .eq('id', foglioId)

  console.log(`[confirmAndSend] Foglio ${foglioId} confermato con successo.`)
  revalidatePath('/')
}

// Called when client saves a causale edit
export async function saveCausale(formData: FormData) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const dipendente_id = formData.get('dipendente_id') as string
  const giorno = parseInt(formData.get('giorno') as string, 10)
  const numero = parseInt(formData.get('numero') as string, 10)
  const codice = (formData.get('codice') as string)?.trim() || null
  const ore = formData.get('ore') ? parseFloat(formData.get('ore') as string) : null
  const note = (formData.get('note') as string)?.trim() || null
  const alGiornoStr = formData.get('alGiorno') as string
  const alGiorno = alGiornoStr ? parseInt(alGiornoStr, 10) : giorno

  if (!dipendente_id || !giorno || !numero) throw new Error('Dati mancanti')

  const oreRaw = formData.get('ore') as string
  const useMax = oreRaw === 'MAX'
  const oreNum = (oreRaw && !isNaN(parseFloat(oreRaw))) ? parseFloat(oreRaw) : null

  const selectedDaysStr = formData.get('selectedDays') as string
  const daysToUpdate = selectedDaysStr ? JSON.parse(selectedDaysStr) as number[] : []
  if (daysToUpdate.length === 0) {
    for (let g = giorno; g <= alGiorno; g++) daysToUpdate.push(g)
  }

  // Se codice è null, l'utente sta richiedendo la cancellazione (handleClear)
  if (!codice) {
    // Gestisce array di giorni o range
    for (const g of daysToUpdate) {
      const { error } = await admin
        .from('causali')
        .delete()
        .eq('dipendente_id', dipendente_id)
        .eq('giorno', g)
        .eq('numero', numero)
        
      if (error) console.error("Error deleting causale:", error.message)
    }
    revalidatePath('/')
    return
  }

  // Se c'è un codice, procediamo con l'inserimento/aggiornamento

  // Fetch giornate to know worked hours (ore_lavorate) and theoretical (ore_contrattuali)
  const { data: giornate } = await admin
    .from('giornate')
    .select('giorno, ore_lavorate, ore_contrattuali')
    .eq('dipendente_id', dipendente_id)
    .in('giorno', daysToUpdate)

  const giornateMap = new Map((giornate || []).map(g => [g.giorno, { lavorate: g.ore_lavorate, contrattuali: g.ore_contrattuali }]))

  // Fetch all existing causali for these days to calculate available space if useMax is active
  const { data: existingCausali } = await admin
    .from('causali')
    .select('giorno, numero, ore')
    .eq('dipendente_id', dipendente_id)
    .in('giorno', daysToUpdate)
  
  const existingMap = new Map<number, Array<{numero: number, ore: number}>>()
  existingCausali?.forEach(c => {
    const list = existingMap.get(c.giorno) || []
    list.push({ numero: c.numero, ore: c.ore || 0 })
    existingMap.set(c.giorno, list)
  })

  const upserts = []
  for (const g of daysToUpdate) {
    let finalOre = oreNum
    const info = giornateMap.get(g)
    const oreLavorate = info?.lavorate ?? 0
    const oreContrattuali = info?.contrattuali ?? 0
    
    // Skip duplicates on days with no theoretical ordinary hours (e.g. weekends) if it's a multi-day selection
    if (daysToUpdate.length > 1 && codice) {
      if (oreContrattuali <= 0) {
        continue
      }
    }

    if (useMax) {
      const others = existingMap.get(g) || []
      const otherSum = others.filter(o => o.numero !== numero).reduce((acc, o) => acc + o.ore, 0)
      finalOre = Math.max(0, oreLavorate - otherSum)
    } else if (codice && finalOre !== null) {
      // Cap the hours to the maximum theoretical ordinary hours for that day
      finalOre = Math.min(finalOre, oreContrattuali)
    }

    upserts.push({
      dipendente_id,
      giorno: g,
      numero,
      codice: codice || null,
      ore: finalOre,
      note
    })
  }

  if (upserts.length > 0) {
    const { error } = await admin
      .from('causali')
      .upsert(upserts, { onConflict: 'dipendente_id,giorno,numero' })
    if (error) throw new Error(`Errore salvataggio: ${error.message}`)
  }

  revalidatePath('/')
}

export async function clearNightHoursRow(dipendente_id: string) {
  console.log(`Clearing all night hours for dipendente ${dipendente_id}`)
  const admin = createAdminClient()
  const { error } = await admin
    .from('giornate')
    .update({ ore_notturne: null })
    .eq('dipendente_id', dipendente_id)

  if (error) throw new Error(`Errore pulizia ore notturne: ${error.message}`)
  revalidatePath('/')
}

export async function clearCausaleRow(dipendente_id: string, numero: number) {
  console.log(`Clearing row ${numero} for dipendente ${dipendente_id}`)
  const admin = createAdminClient()
  const { error } = await admin
    .from('causali')
    .delete()
    .eq('dipendente_id', dipendente_id)
    .eq('numero', numero)

  if (error) throw new Error(`Errore pulizia riga: ${error.message}`)
  revalidatePath('/')
}

export async function saveGiornata(formData: FormData) {
  const dipendente_id = formData.get('dipendente_id') as string
  const giorno = parseInt(formData.get('giorno') as string, 10)
  const alGiornoStr = formData.get('alGiorno') as string
  const alGiorno = alGiornoStr ? parseInt(alGiornoStr, 10) : giorno
  
  const campo = formData.get('campo') as string // 'ore_lavorate' | 'ore_notturne' | 'turno'
  const valoreRaw = formData.get('valore') as string
  const valore = campo === 'turno' ? (valoreRaw || null) : ((valoreRaw && !isNaN(parseFloat(valoreRaw))) ? parseFloat(valoreRaw) : null)

  const selectedDaysStr = formData.get('selectedDays') as string
  const daysToUpdate = selectedDaysStr ? JSON.parse(selectedDaysStr) as number[] : []
  if (daysToUpdate.length === 0) {
    for (let g = giorno; g <= alGiorno; g++) daysToUpdate.push(g)
  }

  if (!dipendente_id || !giorno || !campo) throw new Error('Dati mancanti')

  const admin = createAdminClient()

  // Se stiamo modificando le ore lavorate, verifichiamo che non siano inferiori alle contrattuali
  if (campo === 'ore_lavorate' && valore !== null) {
    const { data: current } = await admin
      .from('giornate')
      .select('ore_contrattuali')
      .eq('dipendente_id', dipendente_id)
      .eq('giorno', giorno)
      .single()
    
    if (current && current.ore_contrattuali !== null && valore < current.ore_contrattuali) {
      throw new Error(`Per ridurre le ore lavorate usare le causali.`)
    }
  }

  // Se stiamo modificando le ore notturne, verifichiamo che non superino le lavorate
  if (campo === 'ore_notturne' && valore !== null) {
    const { data: current } = await admin
      .from('giornate')
      .select('ore_lavorate')
      .eq('dipendente_id', dipendente_id)
      .eq('giorno', giorno)
      .single()
    
    if (current && current.ore_lavorate !== null && valore > current.ore_lavorate) {
      throw new Error(`Le ore notturne non possono superare le ore lavorate (${current.ore_lavorate}h).`)
    }
  }

  const updates = []
  for (const g of daysToUpdate) {
    updates.push({
      dipendente_id,
      giorno: g,
      [campo]: valore
    })
  }

  const { error } = await admin
    .from('giornate')
    .upsert(updates, { onConflict: 'dipendente_id,giorno' })

  if (error) throw new Error(`Errore salvataggio giornata: ${error.message}`)
  revalidatePath('/')
}

export async function reopenFoglio(foglioId: string) {
  console.log(`[reopenFoglio] Attempting to reopen foglio: ${foglioId}`)
  const admin = createAdminClient()
  
  // Resettiamo sia lo stato utente che lo stato admin per ricominciare da zero
  const { error } = await admin
    .from('fogli_presenza')
    .update({ 
      status: 'bozza', 
      confirmed_at: null,
      admin_status: 'da_fare' 
    })
    .eq('id', foglioId)

  if (error) {
    console.error(`[reopenFoglio] Error:`, error)
    throw new Error(`Errore riapertura foglio: ${error.message}`)
  }
  
  console.log(`[reopenFoglio] Success for foglio: ${foglioId}`)
  revalidatePath('/')
  return { success: true }
}
