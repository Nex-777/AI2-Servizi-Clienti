'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const rawCodice1 = formData.get('email') as string
  const codice2 = formData.get('password') as string

  // Trasformiamo il Codice 1 in una "email interna" fittizia
  const internalEmail = `${rawCodice1.toLowerCase().trim()}@gis-internal.com`

  const { error } = await supabase.auth.signInWithPassword({
    email: internalEmail,
    password: codice2,
  })

  if (error) {
    console.error('Login Error:', error.message)
    // Invece di redirect, lanciamo l'errore per farlo catturare dal client
    // o ritorniamo un oggetto se preferiamo, ma il redirect con query param era il vecchio stile
    throw new Error(error.message)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const rawCodice1 = formData.get('email') as string
  const codice2 = formData.get('password') as string
  const internalEmail = `${rawCodice1.toLowerCase().trim()}@gis-internal.com`

  const { error } = await supabase.auth.signUp({
    email: internalEmail,
    password: codice2,
  })

  if (error) {
    console.error('Signup Error:', error.message)
    redirect('/login?error=true')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
