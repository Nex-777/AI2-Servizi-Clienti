import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://affkwobyluxdtqzrzngp.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmZmt3b2J5bHV4ZHRxenJ6bmdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzU2NjExMCwiZXhwIjoyMDkzMTQyMTEwfQ.Y_8-vQt2AzMCQu-_0kGXbeaQZtxCKSLLprfub9ZzT9E'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createUser(codice1, codice2, role = 'client') {
  const email = `${codice1.toLowerCase().trim()}@gis-internal.com`
  
  // 1. Create user via Admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: codice2,
    email_confirm: true,
    user_metadata: { role: role }
  })

  if (error) {
    console.error(`✗ Errore creazione ${codice1}:`, error.message)
    return
  }

  console.log(`✓ Utente creato: ${data.user.id} (${email})`)

  // 2. Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: data.user.id, email: email, role: role })

  if (profileError) {
    console.error(`✗ Errore profilo ${codice1}:`, profileError.message)
  } else {
    console.log(`✓ Profilo ${role} impostato`)
  }
}

async function main() {
  await createUser('pippo', '123456', 'client')
  console.log('\n✅ Pronto! Puoi testare Pippo.')
}

main()
