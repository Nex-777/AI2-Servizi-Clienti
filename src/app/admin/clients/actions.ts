'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getPatronoByComune } from '@/utils/patroni'

export async function createClientAccount(formData: FormData) {
  const admin = createAdminClient()
  const codice1 = formData.get('codice1') as string
  const codice2 = formData.get('codice2') as string
  const ragione_sociale = formData.get('ragione_sociale') as string
  const numeroDitta = (formData.get('numero_ditta') as string)?.trim() || null
  const numeroSede = formData.get('numero_sede') as string
  const provincia = formData.get('provincia') as string
  const comune = formData.get('comune') as string
  const indirizzo = formData.get('indirizzo') as string
  const isEdile = formData.get('is_edile') === 'true'
  const letteraIdentificativa = (formData.get('lettera_identificativa') as string)?.toUpperCase()?.trim() || null
  const dataSantoPatrono = (formData.get('data_santo_patrono') as string) || getPatronoByComune(comune)
  const email = `${codice1.toLowerCase().trim()}@gis-internal.com`

  // 1. Create or Get user in Auth
  let userId: string
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: codice2,
    email_confirm: true,
    user_metadata: { role: 'client' }
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      // User exists, find them
      const { data: existingUsers } = await admin.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(u => u.email === email)
      if (!existingUser) throw new Error("Utente esistente ma non trovato")
      userId = existingUser.id
      // Update password just in case
      await admin.auth.admin.updateUserById(userId, { password: codice2 })
    } else {
      throw new Error(authError.message)
    }
  } else {
    userId = authUser.user.id
  }

  // 2. Create or Update profile
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      id: userId,
      email: email,
      role: 'client',
      ragione_sociale: ragione_sociale,
      numero_ditta: numeroDitta,
      numero_sede: numeroSede,
      provincia,
      comune,
      indirizzo,
      is_edile: isEdile,
      lettera_identificativa: letteraIdentificativa,
      data_santo_patrono: dataSantoPatrono
    })

  if (profileError) {
    throw new Error(profileError.message)
  }

  revalidatePath('/admin/clients')
}

export async function deleteClientAccount(userId: string) {
  const admin = createAdminClient()
  
  // 1. Delete from Auth (cascades or manual depending on trigger)
  const { error: authError } = await admin.auth.admin.deleteUser(userId)
  
  if (authError) {
    throw new Error(authError.message)
  }

  // 2. Profile is usually deleted by trigger or manual cleanup
  await admin.from('profiles').delete().eq('id', userId)

  revalidatePath('/admin/clients')
}

export async function updateClientProfile(userId: string, formData: FormData) {
  const admin = createAdminClient()
  const ragione_sociale = formData.get('ragione_sociale') as string
  const numeroDitta = (formData.get('numero_ditta') as string)?.trim() || null
  const numeroSede = formData.get('numero_sede') as string
  const provincia = formData.get('provincia') as string
  const comune = formData.get('comune') as string
  const indirizzo = formData.get('indirizzo') as string
  const cap = formData.get('cap') as string
  const civico = formData.get('civico') as string
  const isEdile = formData.get('is_edile') === 'true'
  const letteraIdentificativa = (formData.get('lettera_identificativa') as string)?.toUpperCase()?.trim() || null
  const dataSantoPatrono = (formData.get('data_santo_patrono') as string)

  const { error } = await admin
    .from('profiles')
    .update({
      ragione_sociale: ragione_sociale,
      numero_ditta: numeroDitta,
      numero_sede: numeroSede,
      provincia,
      comune,
      indirizzo,
      cap,
      civico,
      is_edile: isEdile,
      lettera_identificativa: letteraIdentificativa,
      data_santo_patrono: dataSantoPatrono,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Update Profile Error:', error)
    throw new Error(error.message)
  }

  revalidatePath('/admin/clients')
  revalidatePath(`/admin/clients/${userId}/sede`)
}

export async function updateAdditionalSede(clientId: string, sedeId: string, formData: FormData) {
  const admin = createAdminClient()
  const numeroSede = formData.get('numero') as string
  const provincia = formData.get('provincia') as string
  const comune = formData.get('comune') as string
  const indirizzo = formData.get('indirizzo') as string
  const civico = formData.get('civico') as string
  const dataSantoPatrono = formData.get('data_santo_patrono') as string || getPatronoByComune(comune)

  const { error } = await admin
    .from('sedi')
    .update({
      numero: numeroSede,
      provincia,
      comune,
      indirizzo,
      civico,
      data_santo_patrono: dataSantoPatrono,
    })
    .eq('id', sedeId)

  if (error) {
    console.error('Update Additional Sede Error:', error)
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/sede`)
}

export async function addAdditionalSede(clientId: string, formData: FormData) {
  const admin = createAdminClient()
  
  const data = {
    client_id: clientId,
    numero: formData.get('numero') as string,
    provincia: formData.get('provincia') as string,
    comune: formData.get('comune') as string,
    indirizzo: formData.get('indirizzo') as string,
    civico: formData.get('civico') as string,
    data_santo_patrono: formData.get('data_santo_patrono') as string || getPatronoByComune(formData.get('comune') as string)
  }

  const { error } = await admin
    .from('sedi')
    .insert(data)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/sede`)
}

export async function deleteAdditionalSede(clientId: string, sedeId: string) {
  const admin = createAdminClient()
  
  const { error } = await admin
    .from('sedi')
    .delete()
    .eq('id', sedeId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath(`/admin/clients/${clientId}/sede`)
}
