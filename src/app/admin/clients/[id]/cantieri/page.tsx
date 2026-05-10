import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import ClientCantieriPage from './ClientPage'

export const dynamic = 'force-dynamic'

export default async function AdminClientCantieriPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Security Check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    redirect('/')
  }

  const admin = createAdminClient()
  
  // Fetch client info
  const { data: client } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Fetch cantieri
  const { data: cantieri } = await admin
    .from('cantieri')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: false })

  // We can calculate the next code just for display
  let nextCodeDisplay = ''
  if (client.is_edile && client.lettera_identificativa) {
    const letter = client.lettera_identificativa.toUpperCase().trim()
    const latestCantieri = cantieri?.filter(c => c.cod?.toUpperCase().startsWith(letter)) || []
    
    let nextNum = 1
    if (latestCantieri.length > 0 && latestCantieri[0].cod) {
      const match = latestCantieri[0].cod.match(new RegExp(`^${letter}(\\d+)`, 'i'))
      if (match && match[1]) {
        const lastNum = parseInt(match[1], 10)
        nextNum = lastNum + 1
        if (nextNum > 99) nextNum = 1
      }
    }
    nextCodeDisplay = `${letter}${nextNum.toString().padStart(2, '0')}`
  }

  return (
    <ClientCantieriPage 
      clientId={id}
      client={client}
      initialCantieri={cantieri || []}
      nextCodeDisplay={nextCodeDisplay}
    />
  )
}
