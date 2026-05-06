'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createClientAccount(formData: FormData) {
  const admin = createAdminClient()
  const codice1 = formData.get('codice1') as string
  const codice2 = formData.get('codice2') as string
  const numeroDitta = (formData.get('numero_ditta') as string)?.trim() || null
  
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
      numero_ditta: numeroDitta,
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
