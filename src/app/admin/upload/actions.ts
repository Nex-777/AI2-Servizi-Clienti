'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { parseGisCsv } from '@/utils/csv-parser'
import { revalidatePath } from 'next/cache'

/**
 * Parse filename: PRE[6-char numero_ditta][4-char unknown][4-char anno][2-char mese].csv
 * Example: PRE0000990000202604.csv → { numeroDitta: '000099', anno: 2026, mese: 4 }
 */
function parseFilename(filename: string): { numeroDitta: string; anno: number; mese: number } | null {
  // Remove extension, uppercase
  const base = filename.replace(/\.csv$/i, '').toUpperCase()
  // Must start with PRE and have at least 3+6+4+4+2 = 19 chars
  if (!base.startsWith('PRE') || base.length < 19) return null
  const rest = base.slice(3) // remove PRE
  const numeroDitta = rest.slice(0, 6)   // chars 0-5 = numero ditta
  // chars 6-9 = unknown/sede code, skip
  const annoStr = rest.slice(10, 14)     // chars 10-13 = anno
  const meseStr = rest.slice(14, 16)     // chars 14-15 = mese
  const anno = parseInt(annoStr, 10)
  const mese = parseInt(meseStr, 10)
  if (isNaN(anno) || isNaN(mese) || mese < 1 || mese > 12) return null
  return { numeroDitta, anno, mese }
}

export interface UploadResult {
  filename: string
  status: 'ok' | 'error' | 'no_client'
  message: string
  azienda?: string
  cliente?: string
}

export async function uploadMultipleCsv(formData: FormData): Promise<UploadResult[]> {
  const admin = createAdminClient()
  const files = formData.getAll('csv_files') as File[]

  if (!files?.length) throw new Error('Nessun file selezionato')

  const results: UploadResult[] = []

  for (const file of files) {
    const filename = file.name

    // 1. Parse filename
    const parsed = parseFilename(filename)
    if (!parsed) {
      results.push({ filename, status: 'error', message: 'Nome file non nel formato PRE...' })
      continue
    }

    // 2. Find client by numero_ditta
    const { data: clientProfile } = await admin
      .from('profiles')
      .select('id, email')
      .eq('numero_ditta', parsed.numeroDitta)
      .single()

    if (!clientProfile) {
      results.push({
        filename,
        status: 'no_client',
        message: `Nessun cliente con N° ditta ${parsed.numeroDitta}`,
      })
      continue
    }

    // 3. Parse CSV content
    const csvText = await file.text()
    let csvParsed
    try {
      csvParsed = parseGisCsv(csvText)
    } catch (e: unknown) {
      results.push({ filename, status: 'error', message: `Errore parsing: ${e instanceof Error ? e.message : String(e)}` })
      continue
    }

    // 4. Insert foglio_presenza (delete existing same month/year for same client)
    await admin
      .from('fogli_presenza')
      .delete()
      .eq('client_id', clientProfile.id)
      .eq('anno', parsed.anno)
      .eq('mese', parsed.mese)

    const { data: foglio, error: foglioError } = await admin
      .from('fogli_presenza')
      .insert({
        client_id: clientProfile.id,
        azienda: csvParsed.azienda || parsed.numeroDitta,
        sede: csvParsed.sede,
        anno: parsed.anno,
        mese: parsed.mese,
        status: 'bozza',
      })
      .select('id')
      .single()

    if (foglioError || !foglio) {
      results.push({ filename, status: 'error', message: `DB error: ${foglioError?.message}` })
      continue
    }

    // 5. Insert dipendenti + giornate + causali
    let hasError = false
    for (const dip of csvParsed.dipendenti) {
      const { data: dipRecord, error: dipError } = await admin
        .from('dipendenti')
        .insert({ foglio_id: foglio.id, matricola: dip.matricola, cognome_nome: dip.cognomeNome })
        .select('id')
        .single()

      if (dipError || !dipRecord) {
        hasError = true
        break
      }

      const giornateRows = Object.entries(dip.giorni)
        .filter(([, g]) => g.oreLavorate !== null || g.oreNotturne !== null || g.turno)
        .map(([giorno, g]) => ({
          dipendente_id: dipRecord.id,
          giorno: parseInt(giorno, 10),
          ore_lavorate: g.oreLavorate,
          ore_notturne: g.oreNotturne,
          turno: g.turno,
        }))

      if (giornateRows.length > 0) {
        await admin.from('giornate').insert(giornateRows)
      }

      const causaliRows = Object.entries(dip.giorni).flatMap(([giorno, g]) =>
        g.causali
          .filter(c => c.codice || c.ore !== null)
          .map(c => ({
            dipendente_id: dipRecord.id,
            giorno: parseInt(giorno, 10),
            numero: c.numero,
            codice: c.codice,
            ore: c.ore,
          }))
      )

      if (causaliRows.length > 0) {
        await admin.from('causali').insert(causaliRows)
      }
    }

    results.push({
      filename,
      status: hasError ? 'error' : 'ok',
      message: hasError ? 'Errore inserimento dipendenti' : `${csvParsed.dipendenti.length} dipendenti caricati`,
      azienda: csvParsed.azienda,
      cliente: clientProfile.email?.replace('@gis-internal.com', ''),
    })
  }

  revalidatePath('/admin/fogli')
  return results
}
