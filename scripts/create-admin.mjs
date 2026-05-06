import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://affkwobyluxdtqzrzngp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZmt3b2J5bHV4ZHRxenJ6bmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU2NjExMCwiZXhwIjoyMDkzMTQyMTEwfQ.Y_8-vQt2AzMCQu-_0kGXbeaQZtxCKSLLprfub9ZzT9E'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Codice 1: TitoSergio → email interna: titosergio@gis-internal.com
// Codice 2: 631005544
const EMAIL = 'titosergio@gis-internal.com'
const PASSWORD = '631005544'

async function main() {
  // 1. Delete existing user if any
  const { data: existing } = await supabase.auth.admin.listUsers()
  const old = existing?.users?.find(u => u.email === EMAIL)
  if (old) {
    await supabase.auth.admin.deleteUser(old.id)
    console.log('✓ Vecchio utente eliminato')
  }

  // 2. Create user via Admin API (no email confirmation needed)
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'super_admin' }
  })

  if (error) {
    console.error('✗ Errore creazione utente:', error.message)
    process.exit(1)
  }

  console.log('✓ Utente creato:', data.user.id, data.user.email)

  // 3. Upsert profile as super_admin
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: data.user.id, email: EMAIL, role: 'super_admin' })

  if (profileError) {
    console.error('✗ Errore profilo:', profileError.message)
  } else {
    console.log('✓ Profilo super_admin impostato')
  }

  console.log('\n✅ FATTO! Puoi fare login con:')
  console.log('   Codice 1: TitoSergio')
  console.log('   Codice 2: 631005544')
}

main()
