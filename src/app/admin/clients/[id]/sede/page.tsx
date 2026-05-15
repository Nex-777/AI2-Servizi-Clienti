import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Building2, Save, MapPin, Info, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { updateClientProfile, updateAdditionalSede, addAdditionalSede, deleteAdditionalSede } from '../../actions'
import SedeForm from './SedeForm'
import AddSedeForm from './AddSedeForm'
import SedeItem from './SedeItem'

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

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* MAIN SEDE (Sede 1 / Legale) */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-fit">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-50 pb-4">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-600 text-xs font-bold italic">Main</span>
                Sede Principale (N° 1)
              </h2>

              <SedeForm key={client.updated_at || id} id={id} client={client} />
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-slate-200">
              <div className="flex gap-4 items-start">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Info className="h-5 w-5 text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold">Gestione Multi-Sede</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Le sedi aggiuntive (2, 3, 4...) permettono al cliente di gestire fogli presenza separati per ciascuna unità operativa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL SEDI LIST & ADD FORM */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2 px-2">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
                 Altre Sedi Operative ({additionalSedi?.length || 0})
               </h3>
            </div>

            {/* ADDITIONAL SEDI LIST */}
            <div className="space-y-4">
              {additionalSedi?.map((sede) => (
                <SedeItem key={sede.id} clientId={id} sede={sede} />
              ))}

              {(!additionalSedi || additionalSedi.length === 0) && (
                <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3">
                  <MapPin className="h-8 w-8 opacity-20" />
                  <p className="text-sm font-medium">Nessuna sede operativa aggiuntiva</p>
                </div>
              )}
            </div>

            <div className="pt-4">
              <AddSedeForm 
                clientId={id} 
                nextNumero={additionalSedi && additionalSedi.length > 0 
                  ? Math.max(...additionalSedi.map(s => parseInt(s.numero) || 0)) + 1 
                  : 2
                } 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
