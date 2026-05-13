'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { resend } from '@/utils/resend'
import { revalidatePath } from 'next/cache'
import { getCoordinates, getRoadDistance } from '@/utils/geo-services'

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
  is_verified?: boolean
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
  lat: number | null
  lon: number | null
  is_verified: boolean
  manual_km?: number | null
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

function fmtBool(v: boolean) {
  return v ? 'Sì' : 'No'
}

function buildEmailText(
  clientName: string,
  committente: CommittenteData,
  cantiere: CantiereData,
  subappaltatori: SubappaltatoreData[],
  appalto_subappalto: string = 'Appalto',
  appaltatore?: { ragione_sociale: string; cf_piva: string }
): string {
  const now = new Date().toLocaleString('it-IT', { timeZone: 'Europe/Rome' })

  const tipoLabel = {
    privato: 'Privato Cittadino',
    ente_pubblico: 'Ente Pubblico / Stazione Appaltante',
    azienda_privata: 'Azienda Privata (Giuridica)',
  }[committente.tipo]

  let committenteBlock = `--- COMMITTENTE ---
Tipo:                 ${tipoLabel}`

  if (committente.tipo === 'privato') {
    committenteBlock += `
Codice Fiscale:       ${fmt(committente.cf)}
Cognome:              ${fmt(committente.cognome)}
Nome:                 ${fmt(committente.nome)}`
  } else {
    committenteBlock += `
Ragione Sociale:      ${fmt(committente.ragione_sociale)}
Codice Fiscale:       ${fmt(committente.cf)}
Partita IVA:          ${fmt(committente.piva)}`
  }

  committenteBlock += `
Via:                  ${fmt(committente.via)}
Civico:               ${fmt(committente.civico)}
Comune:               ${fmt(committente.comune)}
Provincia:            ${fmt(committente.provincia)}
CAP:                  ${fmt(committente.cap)}`

  if (committente.tipo === 'ente_pubblico') {
    committenteBlock += `
CUP:                  ${fmt(committente.cup)}`
  }

  let appaltatoreBlock = ''
  if (appalto_subappalto === 'Subappalto' && appaltatore) {
    appaltatoreBlock = `
--- APPALTATORE (DITTA AFFIDATARIA) ---
Ragione Sociale:      ${fmt(appaltatore.ragione_sociale)}
Codice Fiscale/PI:    ${fmt(appaltatore.cf_piva)}
`
  }

  let cantiereBlock = `--- CANTIERE (${appalto_subappalto.toUpperCase()}) ---
Codice CNCE Unico:    ${fmt(cantiere.cod_univoco)}
Via:                  ${fmt(cantiere.via)}
Civico:               ${fmt(cantiere.civico)}
Comune:               ${fmt(cantiere.comune)}
Provincia:            ${fmt(cantiere.prov)}
CAP:                  ${fmt(cantiere.cap)}
Sisma 2016:           ${fmtBool(cantiere.sisma)}
Attività Svolta:      ${fmt(cantiere.attivita_svolta)}
Descrizione Lavori:   ${fmt(cantiere.descrizione_lavori)}
Data Inizio:          ${fmt(cantiere.data_inizio)}
Data Fine:            ${fmt(cantiere.data_fine)}
Importo Complessivo:  ${fmtEuro(cantiere.importo_complessivo)}
Importo Lavori Edili: ${fmtEuro(cantiere.importo_lavori_edili)}
Importo Contratto:    ${fmtEuro(cantiere.importo_contratto)}
N° Autonomi:          ${fmt(cantiere.n_autonomi)}
N° Imprese:           ${fmt(cantiere.n_imprese)}
N° Operai:            ${fmt(cantiere.n_operai)}
Note:                 ${fmt(cantiere.nota)}`

  let subBlock = ''
  if (subappaltatori.length === 0) {
    subBlock = '--- SUBAPPALTATORI ---\nNessun subappaltatore dichiarato.'
  } else {
    subBlock = subappaltatori.map((s, i) => {
      const tipo = s.tipo_edile === 'edile' ? 'EDILE' : 'NON EDILE'
      let block = `--- SUBAPPALTATORE ${i + 1} (${tipo}) ---
Ragione Sociale:      ${fmt(s.ragione_sociale)}
Codice Fiscale:       ${fmt(s.codice_fiscale)}
Partita IVA:          ${fmt(s.partita_iva)}`
      if (s.tipo_edile === 'edile') {
        block += `
N° Iscrizione CE:     ${fmt(s.numero_iscrizione_ce)}`
      }
      block += `
Via:                  ${fmt(s.via)}
Civico:               ${fmt(s.civico)}
Comune:               ${fmt(s.comune)}
Provincia:            ${fmt(s.provincia)}
CAP:                  ${fmt(s.cap)}
Telefono:             ${fmt(s.telefono)}
Email:                ${fmt(s.email)}
Tipo Lavoro:          ${fmt(s.tipo_lavoro)}
Attività Svolta:      ${fmt(s.attivita_svolta)}
Data Inizio Presunta: ${fmt(s.data_inizio_presunta)}
Data Fine Presunta:   ${fmt(s.data_fine_presunta)}
Descrizione Lavori:   ${fmt(s.descrizione_lavori)}
Importo Edile:        ${fmtEuro(s.importo_edile)}
Lavoratore Autonomo:  ${fmtBool(s.lavoratore_autonomo)}`
      return block
    }).join('\n\n')
  }

  return `
=====================================
  NUOVA DENUNCIA CANTIERE — AI2
=====================================
Cliente:  ${clientName}
Inviata:  ${now}

${appaltatoreBlock}
${committenteBlock}

${cantiereBlock}

${subBlock}
=====================================
`.trim()
}

// ─── Main Action ──────────────────────────────────────────────────────────────

export async function submitDNL(payload: SubmitDNLPayload): Promise<{ success: boolean; cantiereId?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    // 1. Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return { success: false, error: 'Sessione scaduta. Rieffettuare il login.' }

    // 1b. Determine target client_id
    let targetClientId = user.id
    
    // Sanitize clientId: handle case where it might be string "undefined" or "null"
    const providedClientId = (payload.clientId === 'undefined' || payload.clientId === 'null') 
      ? undefined 
      : payload.clientId;

    if (providedClientId && providedClientId !== user.id) {
      // Check if user is admin
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

    // 2. Get profile for email and geo-coordinates
    const { data: profile } = await admin
      .from('profiles')
      .select('email, indirizzo, comune, provincia, lat, lon')
      .eq('id', targetClientId)
      .single()

    const clientName = profile?.email || user.email || 'Cliente sconosciuto'

    // 2.1. Handle HQ Geocoding if missing
    let hqLat = profile?.lat
    let hqLon = profile?.lon

    if (profile && (!hqLat || !hqLon) && profile.indirizzo && profile.comune) {
      const hqCoords = await getCoordinates(profile.indirizzo, profile.comune, profile.provincia || '')
      if (hqCoords) {
        hqLat = hqCoords.lat
        hqLon = hqCoords.lon
        // Update profile in background to cache coords
        await admin.from('profiles').update({ lat: hqLat, lon: hqLon, is_verified: true }).eq('id', targetClientId)
      }
    }

    const { committente, cantiere, subappaltatori, appalto_subappalto = 'Appalto', appaltatore } = payload

    // 2.2. Handle Distance and Geocoding
    let cantiereLat: number | null = cantiere.lat
    let cantiereLon: number | null = cantiere.lon
    let distanzaKm: number | null = null

    // 3. Priority to manual KM if provided
    if (cantiere.manual_km && cantiere.manual_km > 0) {
      distanzaKm = cantiere.manual_km
    }

    // 4. Geocode if verified and coordinates are missing
    if (cantiere.is_verified && (!cantiereLat || !cantiereLon)) {
      const cantiereCoords = await getCoordinates(cantiere.via, cantiere.comune, cantiere.prov)
      if (cantiereCoords) {
        cantiereLat = cantiereCoords.lat
        cantiereLon = cantiereCoords.lon
      }
    }

    // 5. Distance calculation (Manual KM > Auto GPS)
    if (!distanzaKm && cantiereLat && cantiereLon && hqLat && hqLon) {
      distanzaKm = await getRoadDistance(hqLat, hqLon, cantiereLat, cantiereLon)
    }

    // 3. Build the committente label for the legacy 'committente' field
    const committenteLabel = committente.tipo === 'privato'
      ? `${committente.cognome} ${committente.nome}`.trim() || 'Privato'
      : committente.ragione_sociale || 'Ente/Azienda'

    // 4. Build the Cantiere Name (Legacy 'cantiere' field)
    // format: [CODICE] VIA CIVICO COMUNE PROV COMMITTENTE/APPALTATORE
    // Wait, the 'cantiere' field in DB is traditionally just the address, 
    // but the user wants the display in the dropdown to be composed.
    // To ensure compatibility, we'll keep 'cantiere' as the address (via),
    // and let the frontend compose the label as we did in FoglioPresenze.tsx.
    
    // 5. Generate Cantiere Code
    const { generateAndAssignCantiereCode } = await import('@/utils/codeGenerator')
    const autoCode = await generateAndAssignCantiereCode(targetClientId)

    // 6. Insert cantiere
    const { data: newCantiere, error: insertError } = await admin
      .from('cantieri')
      .insert({
        client_id: targetClientId,
        cod: autoCode,
        // existing fields (legacy compat)
        cantiere: cantiere.via, // We keep the address here
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
        // appaltatore fields (new)
        appaltatore_ragione_sociale: appaltatore?.ragione_sociale || null,
        appaltatore_cf: appaltatore?.cf_piva || null,
        // new DNL fields
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
        // geo fields
        lat: cantiereLat,
        lon: cantiereLon,
        distanza_km: distanzaKm,
        is_verified: cantiere.is_verified || false,
      })
      .select('id')
      .single()

    if (insertError || !newCantiere) {
      console.error('Errore inserimento cantiere:', insertError)
      return { success: false, error: insertError?.message || 'Errore salvataggio cantiere.' }
    }

    const cantiereId = newCantiere.id

    // 5. Insert subappaltatori
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
        email_sub: s.email || null,
        tipo_edile: s.tipo_edile,
        numero_iscrizione_ce: s.tipo_edile === 'edile' ? s.numero_iscrizione_ce : null,
        tipo_lavoro: s.tipo_lavoro || 'subappalto',
        attivita_svolta: s.attivita_svolta || null,
        data_inizio_presunta: s.data_inizio_presunta || null,
        data_fine_presunta: s.data_fine_presunta || null,
        descrizione_lavori: s.descrizione_lavori || null,
        importo_edile: s.importo_edile ? parseFloat(s.importo_edile.replace(',', '.')) : null,
        lavoratore_autonomo: s.lavoratore_autonomo || false,
      }))

      const { error: subError } = await admin
        .from('subappaltatori_cantiere')
        .insert(subRows)

      if (subError) {
        console.error('Errore inserimento subappaltatori:', subError)
        // Non blocchiamo: il cantiere è già salvato, logghiamo l'errore
      }
    }

    // 6. Build and send email
    const emailText = buildEmailText(clientName, committente, cantiere, subappaltatori, appalto_subappalto, appaltatore)

    await resend.emails.send({
      from: 'AI2 Servizi Clienti <notifiche@agenziaitalia2.it>',
      to: [process.env.ADMIN_EMAIL || 'paoletti@agenziaitalia2.it'],
      subject: `Nuova DNL Cantiere — ${committenteLabel} — ${cantiere.comune} (${cantiere.prov})`,
      text: emailText,
    })

    revalidatePath('/')
    return { success: true, cantiereId }
  } catch (err: any) {
    console.error('submitDNL error:', err)
    return { success: false, error: err.message || 'Errore imprevisto.' }
  }
}
