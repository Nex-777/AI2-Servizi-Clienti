import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import { UploadCloud, Users, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'
import ClientPage from './ClientPage'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Fetch role from profiles table
  let role = 'client'
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
  } else if (profile?.role) {
    role = profile.role
  }

  // Admin View
  if (role === 'super_admin') {
    return (
      <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
          <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-6 gap-4">
            <div className="flex items-center gap-4">
              <img src="/logo.jpg" alt="AI2 Logo" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI2 - Servizi Clienti</h1>
                <p className="mt-1 text-sm text-slate-500">Gestione dati territoriali e anagrafiche clienti</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex flex-col text-right px-2">
                  <span className="text-sm font-semibold text-slate-900">{user.email}</span>
                  <span className="text-xs text-[#D32F2F] font-bold uppercase tracking-wider">Amministratore</span>
               </div>
               <div className="h-8 w-px bg-slate-200"></div>
               <form action="/auth/signout" method="post">
                  <button className="p-2 text-slate-400 hover:text-[#D32F2F] hover:bg-slate-50 rounded-lg transition-colors" title="Esci">
                    <LogOut className="h-5 w-5" />
                  </button>
               </form>
            </div>
          </header>

          <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-[#D32F2F]/50 hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#D32F2F]"><UploadCloud className="h-6 w-6" /></div>
                <h2 className="text-xl font-bold mb-2 text-slate-900">Caricamento CSV</h2>
                <p className="text-sm text-slate-500 mb-6">Carica i file CSV per aggiornare i dati GIS.</p>
                <Link href="/admin/upload" className="w-full inline-flex justify-center rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b02727] transition-colors">Carica CSV</Link>
             </div>
             <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Users className="h-6 w-6" /></div>
                <h2 className="text-xl font-bold mb-2 text-slate-900">Anagrafica Clienti</h2>
                <p className="text-sm text-slate-500 mb-6">Gestisci i clienti e le autorizzazioni.</p>
                <Link href="/admin/clients" className="w-full inline-flex justify-center rounded-lg border border-slate-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Apri Gestione</Link>
             </div>
             <div className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-amber-500/50 hover:shadow-lg">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Settings className="h-6 w-6" /></div>
                <h2 className="text-xl font-bold mb-2 text-slate-900">Configurazione</h2>
                <p className="text-sm text-slate-500 mb-6">Definisci le regole di associazione CSV.</p>
                <button className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Impostazioni</button>
             </div>
          </main>
        </div>
      </div>
    )
  }

  // Client View
  const admin = createAdminClient()
  
  // 1. Fetch all fogli for the dashboard list
  const { data: fogli } = await admin
    .from('fogli_presenza')
    .select('id, azienda, anno, mese, status')
    .eq('client_id', user.id)
    .order('anno', { ascending: false })
    .order('mese', { ascending: false })

  // 2. If a specific foglio is selected, fetch its full data
  let selectedFoglioData = null
  if (id) {
    const { data: foglio } = await admin
      .from('fogli_presenza')
      .select('*')
      .eq('id', id)
      .eq('client_id', user.id) // Security check
      .single()

    if (foglio) {
      const { data: dipendenti } = await admin
        .from('dipendenti')
        .select('*')
        .eq('foglio_id', foglio.id)

      const dipendentiConDati = await Promise.all(
        (dipendenti || []).map(async (dip) => {
          const { data: giornate } = await admin.from('giornate').select('*').eq('dipendente_id', dip.id)
          const { data: causali } = await admin.from('causali').select('*').eq('dipendente_id', dip.id)
          return { ...dip, giornate: giornate || [], causali: causali || [] }
        })
      )
      selectedFoglioData = { ...foglio, dipendenti: dipendentiConDati }
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo.jpg" alt="AI2 Logo" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Area Riservata Clienti</h1>
              <p className="mt-1 text-sm text-slate-500">Gestione Presenze e Servizi AI2</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex flex-col text-right px-2">
                <span className="text-sm font-semibold text-slate-900">{user.email}</span>
                <span className="text-xs text-[#D32F2F] font-bold uppercase tracking-wider">Cliente</span>
             </div>
             <div className="h-8 w-px bg-slate-200"></div>
             <form action="/auth/signout" method="post">
                <button className="p-2 text-slate-400 hover:text-[#D32F2F] hover:bg-slate-50 rounded-lg transition-colors" title="Esci">
                  <LogOut className="h-5 w-5" />
                </button>
             </form>
          </div>
        </header>

        <main>
          <ClientPage 
            userEmail={user.email!} 
            fogli={fogli || []} 
            selectedFoglioData={selectedFoglioData}
          />
        </main>
      </div>
    </div>
  )
}
