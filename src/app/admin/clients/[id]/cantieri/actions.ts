'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addCantiere(clientId: string, formData: FormData) {
  const admin = createAdminClient()
  
  const { generateAndAssignCantiereCode } = await import('@/utils/codeGenerator')
  const autoCode = await generateAndAssignCantiereCode(clientId)

  const data = {
    client_id: clientId,
    cod: autoCode || (formData.get('cod') as string),
    cantiere: formData.get('cantiere') as string,
    civico: formData.get('civico') as string,
    comune: formData.get('comune') as string,
    cap: formData.get('cap') as string,
    prov: formData.get('prov') as string,
    committente: formData.get('committente') as string,
    cod_univoco: formData.get('cod_univoco') as string,
    cig: formData.get('cig') as string,
    cup: formData.get('cup') as string,
    da: formData.get('da') as string,
    a: formData.get('a') as string,
    sisma: formData.get('sisma') as string,
    appalto_subappalto: formData.get('appalto_subappalto') as string,
    cf_appaltatore: formData.get('cf_appaltatore') as string,
    
    // DNL fields - Committente
    tipo_committente: formData.get('tipo_committente') as string,
    committente_cf: formData.get('committente_cf') as string,
    committente_piva: formData.get('committente_piva') as string,
    committente_via: formData.get('committente_via') as string,
    committente_civico: formData.get('committente_civico') as string,
    committente_cap: formData.get('committente_cap') as string,
    committente_comune: formData.get('committente_comune') as string,
    committente_provincia: formData.get('committente_provincia') as string,

    // DNL fields - Lavoro
    attivita_svolta: formData.get('attivita_svolta') as string,
    descrizione_lavori: formData.get('descrizione_lavori') as string,
    importo_complessivo: formData.get('importo_complessivo') ? parseFloat((formData.get('importo_complessivo') as string).replace(',', '.')) : null,
    importo_lavori_edili: formData.get('importo_lavori_edili') ? parseFloat((formData.get('importo_lavori_edili') as string).replace(',', '.')) : null,
    importo_contratto: formData.get('importo_contratto') ? parseFloat((formData.get('importo_contratto') as string).replace(',', '.')) : null,
    
    // DNL fields - Statistiche e Note
    n_autonomi: formData.get('n_autonomi') ? parseInt(formData.get('n_autonomi') as string) : 0,
    n_imprese: formData.get('n_imprese') ? parseInt(formData.get('n_imprese') as string) : 0,
    n_operai: formData.get('n_operai') ? parseInt(formData.get('n_operai') as string) : 0,
    nota: formData.get('nota') as string,
    dnl_status: formData.get('dnl_status') as string,
    is_archived: formData.get('is_archived') === 'true',
    distanza_km: formData.get('distanza_km') as string || null
  }

  const { error } = await admin
    .from('cantieri')
    .insert(data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/cantieri`)
  revalidatePath('/')
}

export async function updateCantiere(clientId: string, cantiereId: string, formData: FormData) {
  const admin = createAdminClient()
  
  const data = {
    cod: formData.get('cod') as string,
    cantiere: formData.get('cantiere') as string,
    civico: formData.get('civico') as string,
    comune: formData.get('comune') as string,
    cap: formData.get('cap') as string,
    prov: formData.get('prov') as string,
    committente: formData.get('committente') as string,
    cod_univoco: formData.get('cod_univoco') as string,
    cig: formData.get('cig') as string,
    cup: formData.get('cup') as string,
    da: formData.get('da') as string,
    a: formData.get('a') as string,
    sisma: formData.get('sisma') as string,
    appalto_subappalto: formData.get('appalto_subappalto') as string,
    cf_appaltatore: formData.get('cf_appaltatore') as string,
    
    // DNL fields - Committente
    tipo_committente: formData.get('tipo_committente') as string,
    committente_cf: formData.get('committente_cf') as string,
    committente_piva: formData.get('committente_piva') as string,
    committente_via: formData.get('committente_via') as string,
    committente_civico: formData.get('committente_civico') as string,
    committente_cap: formData.get('committente_cap') as string,
    committente_comune: formData.get('committente_comune') as string,
    committente_provincia: formData.get('committente_provincia') as string,

    // DNL fields - Lavoro
    attivita_svolta: formData.get('attivita_svolta') as string,
    descrizione_lavori: formData.get('descrizione_lavori') as string,
    importo_complessivo: formData.get('importo_complessivo') ? parseFloat((formData.get('importo_complessivo') as string).replace(',', '.')) : null,
    importo_lavori_edili: formData.get('importo_lavori_edili') ? parseFloat((formData.get('importo_lavori_edili') as string).replace(',', '.')) : null,
    importo_contratto: formData.get('importo_contratto') ? parseFloat((formData.get('importo_contratto') as string).replace(',', '.')) : null,
    
    // DNL fields - Statistiche e Note
    n_autonomi: formData.get('n_autonomi') ? parseInt(formData.get('n_autonomi') as string) : 0,
    n_imprese: formData.get('n_imprese') ? parseInt(formData.get('n_imprese') as string) : 0,
    n_operai: formData.get('n_operai') ? parseInt(formData.get('n_operai') as string) : 0,
    nota: formData.get('nota') as string,
    dnl_status: formData.get('dnl_status') as string,
    is_archived: formData.get('is_archived') === 'true',
    distanza_km: formData.get('distanza_km') as string || null
  }

  const { error } = await admin
    .from('cantieri')
    .update(data)
    .eq('id', cantiereId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/cantieri`)
  revalidatePath('/')
}

export async function deleteCantiere(clientId: string, cantiereId: string) {
  const admin = createAdminClient()
  
  const { error } = await admin
    .from('cantieri')
    .delete()
    .eq('id', cantiereId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/cantieri`)
  revalidatePath('/')
}

export async function toggleArchiveCantiere(clientId: string, cantiereId: string, currentStatus: boolean) {
  const admin = createAdminClient()
  
  const { error } = await admin
    .from('cantieri')
    .update({ is_archived: !currentStatus })
    .eq('id', cantiereId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/cantieri`)
  revalidatePath('/')
}

export async function prorogaCantiere(clientId: string, cantiereId: string, nuovaData: string) {
  const admin = createAdminClient()
  
  const { error } = await admin
    .from('cantieri')
    .update({ a: nuovaData })
    .eq('id', cantiereId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/cantieri`)
  revalidatePath('/')
}
