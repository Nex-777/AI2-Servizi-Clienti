'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { resend } from '@/utils/resend'
import { revalidatePath } from 'next/cache'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommittenteData {
  tipo: 'privato' | 'ente_pubblico' | 'azienda_privata'
  // privato
  cf: string
  cognome: string
  nome: string
  // ente / azienda
  ragione_sociale: string
  piva: string
  // comune a tutti
  via: string
  civico: string
  cap: string
  comune: string
  provincia: string
  // solo ente_pubblico
  cup: string
}

export interface CantiereData {
  via: string
  civico: string
  cap: string
  comune: string
  prov: string
  sisma: boolean
  attivita_svolta: string
  descrizione_lavori: string
  data_inizio: string
  data_fine: string
  importo_complessivo: string
  importo_lavori_edili: string
  importo_contratto: string
  n_autonomi: string
  n_imprese: string
  n_operai: string
  nota: string
  cod_univoco?: string
  distanza_km?: string | null
}

export interface SubappaltatoreData {
  ragione_sociale: string
  codice_fiscale: string
  partita_iva: string
  via: string
  civico: string
  cap: string
  comune: string
  provincia: string
  telefono: string
  email: string
  tipo_edile: 'edile' | 'non_edile'
  numero_iscrizione_ce: string
  tipo_lavoro: string
  attivita_svolta: string
  data_inizio_presunta: string
  data_fine_presunta: string
  descrizione_lavori: string
  importo_edile: string
  lavoratore_autonomo: boolean
}

export interface SubmitDNLPayload {
  clientId?: string
  committente: CommittenteData
  cantiere: CantiereData
  subappaltatori: SubappaltatoreData[]
  appalto_subappalto?: 'Appalto' | 'Subappalto'
  appaltatore?: {
    ragione_sociale: string
    cf_piva: string
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: string | null | undefined) {
  return v?.trim() || '—'
}

function fmtEuro(v: string | null | undefined) {
  if (!v?.trim()) return '—'
  const n = parseFloat(v.replace(',', '.'))
  if (isNaN(n)) return v
  return `€ ${n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Main Action ──────────────────────────────────────────────────────────────

export async function submitDNL(payload: SubmitDNLPayload) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    
    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorizzato.' }

    // Logic to determine target client ID (Admin impersonation vs Regular User)
    const providedClientId = payload.clientId
    let targetClientId = user.id

    if (providedClientId && providedClientId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'super_admin' || profile?.role === 'admin') {
        targetClientId = providedClientId
      } else {
        return { success: false, error: 'Permesso negato: non sei un amministratore.' }
      }
    }

    // 2. Get profile for email
    const { data: profile } = await admin
      .from('profiles')
      .select('email')
      .eq('id', targetClientId)
      .single()

    const clientName = profile?.email || user.email || 'Cliente sconosciuto'
    const { committente, cantiere, subappaltatori, appalto_subappalto = 'Appalto', appaltatore } = payload

    // 3. Build the committente label
    const committenteLabel = committente.tipo === 'privato'
      ? `${committente.cognome} ${committente.nome}`.trim() || 'Privato'
      : committente.ragione_sociale || 'Ente/Azienda'

    // 4. Generate Cantiere Code
    const { generateAndAssignCantiereCode } = await import('@/utils/codeGenerator')
    const autoCode = await generateAndAssignCantiereCode(targetClientId)

    // 5. Insert cantiere (Simplified: no geo calculation)
    const { data: newCantiere, error: insertError } = await admin
      .from('cantieri')
      .insert({
        client_id: targetClientId,
        cod: autoCode,
        cantiere: cantiere.via,
        civico: cantiere.civico,
        comune: cantiere.comune,
        cap: cantiere.cap,
        prov: cantiere.prov,
        cod_univoco: cantiere.cod_univoco || null,
        committente: appalto_subappalto === 'Subappalto' ? (appaltatore?.ragione_sociale || 'Appaltatore') : committenteLabel,
        da: cantiere.data_inizio,
        a: cantiere.data_fine,
        cup: committente.tipo === 'ente_pubblico' ? committente.cup : null,
        sisma: cantiere.sisma ? 'SI' : 'NO',
        appalto_subappalto: appalto_subappalto,
        appaltatore_ragione_sociale: appaltatore?.ragione_sociale || null,
        appaltatore_cf: appaltatore?.cf_piva || null,
        tipo_committente: committente.tipo,
        committente_cf: committente.cf,
        committente_cognome: committente.cognome || null,
        committente_nome: committente.nome || null,
        committente_ragione_sociale: committente.ragione_sociale || null,
        committente_piva: committente.piva || null,
        committente_via: committente.via,
        committente_civico: committente.civico || null,
        committente_cap: committente.cap,
        committente_comune: committente.comune,
        committente_provincia: committente.provincia,
        descrizione_lavori: cantiere.descrizione_lavori,
        importo_complessivo: cantiere.importo_complessivo ? parseFloat(cantiere.importo_complessivo.replace(',', '.')) : null,
        importo_lavori_edili: cantiere.importo_lavori_edili ? parseFloat(cantiere.importo_lavori_edili.replace(',', '.')) : null,
        importo_contratto: cantiere.importo_contratto ? parseFloat(cantiere.importo_contratto.replace(',', '.')) : null,
        attivita_svolta: cantiere.attivita_svolta,
        n_autonomi: cantiere.n_autonomi ? parseInt(cantiere.n_autonomi) : null,
        n_imprese: cantiere.n_imprese ? parseInt(cantiere.n_imprese) : null,
        n_operai: cantiere.n_operai ? parseInt(cantiere.n_operai) : null,
        nota: cantiere.nota || null,
        dnl_status: 'confermato',
        distanza_km: cantiere.distanza_km || null
      })
      .select('id')
      .single()

    if (insertError || !newCantiere) {
      console.error('Errore inserimento cantiere:', insertError)
      return { success: false, error: insertError?.message || 'Errore salvataggio cantiere.' }
    }

    const cantiereId = newCantiere.id

    // 6. Insert subappaltatori
    if (subappaltatori.length > 0) {
      const subRows = subappaltatori.map((s) => ({
        cantiere_id: cantiereId,
        client_id: targetClientId,
        ragione_sociale: s.ragione_sociale,
        codice_fiscale: s.codice_fiscale,
        partita_iva: s.partita_iva || null,
        via: s.via || null,
        civico: s.civico || null,
        cap: s.cap || null,
        comune: s.comune || null,
        provincia: s.provincia || null,
        telefono: s.telefono || null,
        email: s.email || null,
        tipo_edile: s.tipo_edile,
        numero_iscrizione_ce: s.numero_iscrizione_ce || null,
        tipo_lavoro: s.tipo_lavoro || null,
        attivita_svolta: s.attivita_svolta || null,
        data_inizio_presunta: s.data_inizio_presunta || null,
        data_fine_presunta: s.data_fine_presunta || null,
        descrizione_lavori: s.descrizione_lavori || null,
        importo_edile: s.importo_edile ? parseFloat(s.importo_edile.replace(',', '.')) : null,
        lavoratore_autonomo: s.lavoratore_autonomo || false
      }))

      const { error: subError } = await admin.from('subappaltatori_cantiere').insert(subRows)
      if (subError) {
        console.error('Errore inserimento subappaltatori:', subError)
      }
    }

    // 7. Send notification email
    const month = new Date().toLocaleString('it-IT', { month: 'long' })
    const year = new Date().getFullYear()

    try {
      await resend.emails.send({
        from: 'AI2 Servizi Clienti <noreply@ai2serviziclienti.it>',
        to: [process.env.ADMIN_EMAIL || 'paoletti@agenziaitalia2.it'],
        subject: `DNL - [${autoCode}] - ${clientName.split('@')[0].toUpperCase()}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #D32F2F;">Nuova DNL Ricevuta</h2>
            <p>È stato inserito un nuovo cantiere <strong>${autoCode}</strong> per il cliente <strong>${clientName}</strong>.</p>
            
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; color: #444;">Dettagli Cantiere</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Indirizzo:</strong> ${fmt(cantiere.via)}, ${fmt(cantiere.civico)} - ${fmt(cantiere.comune)} (${fmt(cantiere.prov)})</li>
              <li><strong>Inizio/Fine:</strong> ${fmt(cantiere.data_inizio)} / ${fmt(cantiere.data_fine)}</li>
              <li><strong>Distanza dalla sede:</strong> ${fmt(cantiere.distanza_km)}</li>
              <li><strong>Attività:</strong> ${fmt(cantiere.attivita_svolta)}</li>
              <li><strong>Importo Lavori Edili:</strong> ${fmtEuro(cantiere.importo_lavori_edili)}</li>
            </ul>
 
            <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; color: #444;">Committente</h3>
            <p>${fmt(committenteLabel)} (${fmt(committente.cf || committente.piva)})</p>

            ${subappaltatori.length > 0 ? `
              <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px; color: #444;">Subappaltatori (${subappaltatori.length})</h3>
              <ul style="list-style: none; padding: 0;">
                ${subappaltatori.map(s => `<li>- ${s.ragione_sociale} (${s.tipo_edile})</li>`).join('')}
              </ul>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
              Sistema automatico AI2 Servizi Clienti
            </div>
          </div>
        `
      })
    } catch (err) {
      console.error('Errore invio email:', err)
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin/cantieri')
    return { success: true, cantiereId }

  } catch (error: any) {
    console.error('submitDNL Critical Error:', error)
    return { success: false, error: 'Si è verificato un errore imprevisto durante il salvataggio.' }
  }
}
