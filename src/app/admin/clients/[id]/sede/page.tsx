import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Building2, Save, MapPin, Info, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { updateClientProfile, updateClientSede, addAdditionalSede, deleteAdditionalSede } from '../../actions'
import SedeForm from './SedeForm'

export const dynamic = 'force-dynamic'

export default async function AdminClientSedePage({
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
  
  // Fetch client info (Main Sede)
  const { data: client } = await admin
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  // Fetch additional sedi
  const { data: additionalSedi } = await admin
    .from('sedi')
    .select('*')
    .eq('client_id', id)
    .order('numero', { ascending: true })

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/clients"
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">Gestione Sedi Operative</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <Building2 className="h-7 w-7 text-blue-600" />
                {client.email?.replace('@gis-internal.com', '')}
              </h1>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* MAIN SEDE (Sede 1 / Legale) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-bold italic">Main</span>
                Anagrafica e Sede Principale
              </h2>

              <SedeForm id={id} client={client} />
            </div>

            <div className="p-5 bg-amber-50 border border-amber-100 rounded-3xl flex gap-4 items-start">
              <Info className="h-6 w-6 text-amber-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-amber-900">Nota per l'amministratore</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Puoi definire più sedi operative per lo stesso cliente. Ciascuna sede deve essere identificata da un numero univoco (es. 1, 2, 3...). 
                  L'utente vedrà l'elenco completo nella sua area riservata.
                </p>
              </div>
            </div>
          </div>

          {/* ADDITIONAL SEDI */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                <Plus className="h-5 w-5 text-blue-600" />
                Aggiungi Altra Sede
              </h2>

              <form action={async (formData) => {
                'use server'
                await addAdditionalSede(id, formData)
              }} className="space-y-5">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">N° Sede</label>
                    <input 
                      name="numero" 
                      type="text" 
                      required
                      placeholder="Es. 2"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Provincia</label>
                    <input name="provincia" type="text" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Comune</label>
                    <input name="comune" type="text" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Indirizzo</label>
                  <input name="indirizzo" type="text" required className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-md">
                   Aggiungi Sede Operativa
                </button>
              </form>
            </div>

            {/* ADDITIONAL SEDI LIST */}
            <div className="space-y-4">
              {additionalSedi?.map((sede) => (
                <div key={sede.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex justify-between items-center group">
                  <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {sede.numero}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{sede.comune} ({sede.provincia})</h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {sede.indirizzo}
                      </p>
                    </div>
                  </div>
                  <form action={async () => {
                    'use server'
                    await deleteAdditionalSede(id, sede.id)
                  }}>
                    <button type="submit" className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
