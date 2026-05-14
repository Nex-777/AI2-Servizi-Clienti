'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { resend } from '@/utils/resend'
import { revalidatePath } from 'next/cache'
import { SubappaltatoreData } from './submitDNL'

interface IntegrationPayload {
  parentCantiereId: string
  subData: SubappaltatoreData
}

function fmt(v: string | null | undefined) {
  return v?.trim() || '—'
}

function fmtEuro(v: string | null | undefined) {
  if (!v?.trim()) return '—'
  const n = parseFloat(v.replace(',', '.'))
  if (isNaN(n)) return v
  return `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtBool(v: boolean) {
  return v ? 'Sì' : 'No'
}

export async function addIntegrationSubappalto(payload: IntegrationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient()
    const { parentCantiereId, subData } = payload

    // 1. Fetch Parent Cantiere Data for Email
    const { data: cantiere, error: cantError } = await admin
      .from('cantieri')
      .select('client_id, cantiere, comune, prov, cod_univoco, profiles(email, ragione_sociale)')
      .eq('id', parentCantiereId)
      .single()

    if (cantError || !cantiere) {
      return { success: false, error: 'Cantiere non trovato.' }
    }

    const parentName = cantiere.cantiere || 'Cantiere'
    const cnceCode = cantiere.cod_univoco || 'NON ASSEGNATO'
    const clientEmail = (cantiere as any).profiles?.email || 'Sconosciuto'
    const clientRagSoc = (cantiere as any).profiles?.ragione_sociale || clientEmail

    // 2. Insert Subappaltatore
    const { error: insertError } = await admin
      .from('subappaltatori_cantiere')
      .insert({
        cantiere_id: parentCantiereId,
        client_id: (cantiere as any).client_id, // We should probably get this from the cantiere record
        ragione_sociale: subData.ragione_sociale,
        codice_fiscale: subData.codice_fiscale,
        partita_iva: subData.partita_iva || null,
        via: subData.via || null,
        civico: subData.civico || null,
        cap: subData.cap || null,
        comune: subData.comune || null,
        provincia: subData.provincia || null,
        telefono: subData.telefono || null,
        email_sub: subData.email || null,
        tipo_edile: subData.tipo_edile,
        numero_iscrizione_ce: subData.tipo_edile === 'edile' ? subData.numero_iscrizione_ce : null,
        tipo_lavoro: subData.tipo_lavoro || 'subappalto',
        attivita_svolta: subData.attivita_svolta || null,
        data_inizio_presunta: subData.data_inizio_presunta || null,
        data_fine_presunta: subData.data_fine_presunta || null,
        descrizione_lavori: subData.descrizione_lavori || null,
        importo_edile: subData.importo_edile ? parseFloat(subData.importo_edile.replace(',', '.')) : null,
        lavoratore_autonomo: subData.lavoratore_autonomo || false,
      })

    if (insertError) {
      console.error('Errore inserimento subappaltatore:', insertError)
      return { success: false, error: 'Errore durante il salvataggio dei dati.' }
    }

    // 3. Send Email
    const emailText = `
=========================================
  INTEGRAZIONE SUBAPPALTO — AI2
=========================================
Cliente:          ${clientRagSoc} (${clientEmail})
Data Invio:       ${new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}

--- DATI CANTIERE PADRE ---
Indirizzo:        ${parentName}
Comune:           ${cantiere.comune} (${cantiere.prov})
Codice Univoco:   ${cnceCode}

--- NUOVO SUBAPPALTATORE ---
Ragione Sociale:  ${fmt(subData.ragione_sociale)}
Codice Fiscale:   ${fmt(subData.codice_fiscale)}
Partita IVA:      ${fmt(subData.partita_iva)}
N° Iscrizione CE: ${subData.tipo_edile === 'edile' ? fmt(subData.numero_iscrizione_ce) : 'N/A'}
Indirizzo:        ${fmt(subData.via)} ${fmt(subData.civico)}
Località:         ${fmt(subData.comune)} (${fmt(subData.provincia)}) - ${fmt(subData.cap)}
Telefono/Email:   ${fmt(subData.telefono)} / ${fmt(subData.email)}

Tipo Lavoro:      ${fmt(subData.tipo_lavoro)}
Periodo:          Dal ${fmt(subData.data_inizio_presunta)} Al ${fmt(subData.data_fine_presunta)}
Importo Edile:    ${fmtEuro(subData.importo_edile)}
Lavoratore Aut.:  ${fmtBool(subData.lavoratore_autonomo)}

Descrizione Lavori:
${fmt(subData.descrizione_lavori)}

=========================================
`.trim()

    await resend.emails.send({
      from: 'AI2 Servizi Clienti <notifiche@agenziaitalia2.it>',
      to: [process.env.ADMIN_EMAIL || 'paoletti@agenziaitalia2.it'],
      subject: `[INTEGRAZIONE SUBAPPALTO] - ${parentName} - ${subData.ragione_sociale}`,
      text: emailText,
    })

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    console.error('addIntegrationSubappalto error:', err)
    return { success: false, error: err.message || 'Errore imprevisto.' }
  }
}
