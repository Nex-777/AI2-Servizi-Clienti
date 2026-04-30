import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { UploadCloud, Users, FileText, Settings, LogOut } from 'lucide-react'

export default async function Dashboard() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // NOTE: This assumes the existence of a 'profiles' table.
  // Until you set up Supabase and this table, we will fallback to 'super_admin' 
  // or 'client' based on a simple logic or just fallback for the UI.
  let role = 'client'
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role) {
      role = profile.role
    }
  } catch (e) {
    // Fallback if table doesn't exist yet
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between border-b border-zinc-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-500" />
              Piattaforma GIS
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Gestione dati territoriali e anagrafiche clienti
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800/50">
             <div className="flex flex-col text-right px-2">
                <span className="text-sm font-medium">{user.email}</span>
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">{role === 'super_admin' ? 'Amministratore' : 'Cliente'}</span>
             </div>
             <div className="h-8 w-px bg-zinc-800"></div>
             <form action="/auth/signout" method="post">
               <button className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Esci">
                 <LogOut className="h-5 w-5" />
               </button>
             </form>
          </div>
        </header>

        <main>
          {role === 'super_admin' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
               
               {/* UPLOAD CARD */}
               <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-white">Caricamento CSV</h2>
                  <p className="text-sm text-zinc-400 mb-6 line-clamp-2">
                    Carica i file CSV generati per aggiornare i dati GIS e associarli ai rispettivi clienti.
                  </p>
                  <button className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-colors">
                    Scegli File
                  </button>
               </div>

               {/* GESTIONE CLIENTI CARD */}
               <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Users className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-white">Anagrafica Clienti</h2>
                  <p className="text-sm text-zinc-400 mb-6 line-clamp-2">
                    Visualizza i dati dei clienti, gestisci le autorizzazioni e sblocca le modifiche RLS.
                  </p>
                  <button className="w-full rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                    Apri Gestione
                  </button>
               </div>

               {/* MAPPING CONFIG CARD */}
               <div className="group rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Settings className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-white">Configurazione Mapping</h2>
                  <p className="text-sm text-zinc-400 mb-6 line-clamp-2">
                    Definisci le regole di associazione tra le colonne del CSV e la struttura del database.
                  </p>
                  <button className="w-full rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors">
                    Impostazioni
                  </button>
               </div>

            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 max-w-4xl">
               <div className="mb-8">
                 <h2 className="text-2xl font-semibold mb-2 text-white">I Tuoi Dati GIS</h2>
                 <p className="text-zinc-400">
                   Qui puoi visualizzare e confermare le informazioni raccolte per la tua area. 
                   Una volta approvate, le modifiche verranno bloccate.
                 </p>
               </div>
               
               <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 p-12 text-center">
                 <FileText className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
                 <h3 className="text-lg font-medium text-zinc-300">Nessun dato assegnato</h3>
                 <p className="mt-1 text-sm text-zinc-500">
                   Il consulente non ha ancora caricato alcun dato per il tuo profilo.
                 </p>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
