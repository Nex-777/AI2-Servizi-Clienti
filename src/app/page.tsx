import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
export const dynamic = 'force-dynamic'
import { redirect } from 'next/navigation'
import { UploadCloud, Users, Settings, LogOut, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import ClientPage from './ClientPage'
import AdminFogliList from './admin/AdminFogliList'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string, impersonate?: string }>
}) {
  const { id, impersonate } = await searchParams
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 1. Fetch current user role
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = myProfile?.role === 'super_admin'
  
  // 2. Determine if we are impersonating a client
  const isImpersonating = isAdmin && impersonate
  const effectiveUserId = isImpersonating ? impersonate : user.id

  // 3. Fetch target profile data (for HQ info, etc.)
  const admin = createAdminClient()
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id, role, provincia, comune, indirizzo, numero_sede, email, is_edile, ragione_sociale')
    .eq('id', effectiveUserId)
    .single()

  // 4. Admin Landing Page (if not impersonating)
  if (isAdmin && !impersonate) {
    // Fetch all submitted fogli (status != 'bozza')
    const { data: adminFogli } = await admin
      .from('fogli_presenza')
      .select('id, client_id, azienda, anno, mese, status, admin_status, uploaded_at, note, profiles!fogli_presenza_client_id_fkey(email, ragione_sociale), dipendenti(count)')
      .neq('status', 'bozza')
      .order('anno', { ascending: false })
      .order('mese', { ascending: false })

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
           
           {/* Sezione Lista Segnaore Inviati */}
           {adminFogli && adminFogli.length > 0 && (
             <AdminFogliList fogli={adminFogli as any[]} />
           )}
        </div>
      </div>
    )
  }

  // 5. Client View (Self or Impersonated)
  
  // 5a. Fetch all fogli for the dashboard list
  const { data: fogli } = await admin
    .from('fogli_presenza')
    .select('id, azienda, anno, mese, status')
    .eq('client_id', effectiveUserId)
    .order('anno', { ascending: false })
    .order('mese', { ascending: false })

  // 5b. If a specific foglio is selected, fetch its full data
  let selectedFoglioData = null
  if (id) {
    const { data: foglio } = await admin
      .from('fogli_presenza')
      .select('*')
      .eq('id', id)
      .eq('client_id', effectiveUserId) 
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

      // Fetch CIG fasi lavorative per questo foglio
      const { data: cigFasi } = await admin
        .from('cig_fasi_lavorative')
        .select('cantiere_cod, fase_lavorativa')
        .eq('foglio_id', foglio.id)
      
      selectedFoglioData = { ...foglio, dipendenti: dipendentiConDati, cigFasi: cigFasi || [] }

    }
  }

  // 5c. Fetch cantieri
  const { data: cantieri } = await admin
    .from('cantieri')
    .select('*')
    .eq('client_id', effectiveUserId)
    .order('created_at', { ascending: false })

  // 5d. Fetch all operative locations (sedi)
  const { data: additionalSedi } = await admin
    .from('sedi')
    .select('*')
    .eq('client_id', effectiveUserId)
    .order('numero', { ascending: true })

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Impersonation Banner */}
        {isImpersonating && (
          <div className="mb-6 bg-red-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Modalità Supporto Admin Attiva</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2">
                Stai operando per: {targetProfile?.ragione_sociale || targetProfile?.email}
              </span>
            </div>
            <Link href="/" className="text-xs font-bold bg-white text-red-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              Esci dal Supporto
            </Link>
          </div>
        )}

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
                <span className="text-sm font-semibold text-slate-900">
                  {isImpersonating ? (targetProfile?.ragione_sociale || targetProfile?.email) : (user.email)}
                </span>
                <span className={`text-xs font-bold uppercase tracking-wider ${isImpersonating ? 'text-red-600' : 'text-[#D32F2F]'}`}>
                  {isImpersonating ? 'Impersonificazione' : 'Cliente'}
                </span>
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
            userEmail={isImpersonating ? targetProfile?.email! : user.email!} 
            fogli={fogli || []} 
            selectedFoglioData={selectedFoglioData}
            profile={targetProfile}
            cantieri={cantieri || []}
            additionalSedi={additionalSedi || []}
            isAdmin={isAdmin}
          />
        </main>
      </div>
    </div>
  )
}
