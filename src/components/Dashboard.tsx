'use client'

import { Calendar, Clock, Lock, FileEdit, Eye, ChevronRight, LayoutDashboard, Settings, Users, MessageSquare, Zap, Building2, Construction, Plus, X, Info, ArrowUpRight, MapPin, Calculator, ClipboardList } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { addCantiere, updateCantiere } from '@/app/admin/clients/[id]/cantieri/actions'

interface FoglioSummary {
  id: string
  azienda: string
  anno: number
  mese: number
  status: string
}

const MESI_LABELS = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

export default function Dashboard({ 
  userEmail, 
  fogli, 
  onSelectFoglio,
  profile,
  cantieri,
  additionalSedi
}: { 
  userEmail: string
  fogli: FoglioSummary[]
  onSelectFoglio: (id: string) => void
  profile?: any
  cantieri?: any[]
  additionalSedi?: any[]
}) {
  const [activeModal, setActiveModal] = useState<'sede' | 'cantiere' | null>(null)
  const [viewingCantiere, setViewingCantiere] = useState<any | null>(null)
  const [subs, setSubs] = useState<any[]>([])
  
  useEffect(() => {
    if (viewingCantiere?.id) {
      const fetchSubs = async () => {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        const { data } = await supabase
          .from('subappaltatori_cantiere')
          .select('*')
          .eq('cantiere_id', viewingCantiere.id)
        setSubs(data || [])
      }
      fetchSubs()
    } else {
      setSubs([])
    }
  }, [viewingCantiere])

  // Group fogli by year
  const fogliByYear = fogli.reduce((acc, f) => {
    if (!acc[f.anno]) acc[f.anno] = []
    acc[f.anno].push(f)
    return acc
  }, {} as Record<number, FoglioSummary[]>)

  const sortedYears = Object.keys(fogliByYear).map(Number).sort((a, b) => b - a)

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'bozza':
        return {
          label: 'Da Inviare',
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          icon: <FileEdit className="h-4 w-4" />,
          actionLabel: 'Modifica e Invia'
        }
      case 'confermato':
        return {
          label: 'Inviato',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          icon: <Eye className="h-4 w-4" />,
          actionLabel: 'Visualizza'
        }
      case 'chiuso':
        return {
          label: 'Chiuso',
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          icon: <Lock className="h-4 w-4" />,
          actionLabel: 'Visualizza'
        }
      default:
        return {
          label: status,
          bg: 'bg-slate-50 text-slate-500 border-slate-100',
          icon: <Eye className="h-4 w-4" />,
          actionLabel: 'Visualizza'
        }
    }
  }

  return (
    <div className="space-y-10">
      {/* Welcome Section */}
      <section>
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Benvenuto, {userEmail.split('@')[0]}</h2>
            <p className="mt-2 text-slate-500 max-w-xl">
              Questo è il tuo hub di gestione. Qui puoi controllare i tuoi fogli presenze, consultare lo storico e gestire i servizi attivi.
            </p>
          </div>
          <div className="flex gap-3">
             <div className="flex flex-col items-center bg-red-50 p-4 rounded-2xl border border-red-100 min-w-[120px]">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Stato Mese</span>
                <span className="text-sm font-bold text-slate-900">Aprile 2026</span>
                <span className="mt-1 px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-full">DA INVIARE</span>
             </div>
          </div>
        </div>
      </section>

      {/* Fogli Presenza Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <LayoutDashboard className="h-5 w-5 text-[#D32F2F]" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">I Tuoi Fogli Presenza</h3>
        </div>

        {sortedYears.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h4 className="text-lg font-medium text-slate-600">Nessun foglio caricato</h4>
            <p className="text-sm text-slate-400">Il consulente non ha ancora caricato dati per te.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedYears.map(year => (
              <div key={year} className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{year}</span>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {fogliByYear[year].sort((a, b) => b.mese - a.mese).map(f => {
                    const config = getStatusConfig(f.status)
                    return (
                      <div 
                        key={f.id}
                        onClick={() => onSelectFoglio(f.id)}
                        className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-[#D32F2F]/40 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-red-50 group-hover:text-[#D32F2F] transition-colors">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 ${config.bg}`}>
                              {config.icon}
                              {config.label}
                            </div>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900">{MESI_LABELS[f.mese]}</h4>
                          <p className="text-xs text-slate-500 mt-1">{f.azienda}</p>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-50">
                          <span className="text-xs font-semibold text-slate-400 group-hover:text-[#D32F2F] transition-colors">{config.actionLabel}</span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#D32F2F] group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Azioni Rapide Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Azioni Rapide</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button 
            onClick={() => setActiveModal('sede')}
            className="group relative flex items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#D32F2F]/50 hover:shadow-xl transition-all text-left overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-[#D32F2F] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
            <div className="flex-shrink-0 p-4 bg-red-50 rounded-2xl text-[#D32F2F] group-hover:scale-110 transition-transform">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="pr-8">
              <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#D32F2F] transition-colors">Aggiungi o Varia Sede</h4>
              <p className="text-sm text-slate-500 mt-1">Gestisci le sedi operative della tua azienda o comunica variazioni.</p>
            </div>
            <div className="absolute right-6 h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-red-50 group-hover:text-[#D32F2F] transition-all">
              <Plus className="h-5 w-5" />
            </div>
          </button>
          
          {profile?.is_edile && (
            <button 
              onClick={() => setActiveModal('cantiere')}
              className="group relative flex items-center gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#D32F2F]/50 hover:shadow-xl transition-all text-left overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#D32F2F] transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
              <div className="flex-shrink-0 p-4 bg-red-50 rounded-2xl text-[#D32F2F] group-hover:scale-110 transition-transform">
                <Construction className="h-7 w-7" />
              </div>
              <div className="pr-8">
                <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#D32F2F] transition-colors">Aggiungi o Varia Cantiere</h4>
                <p className="text-sm text-slate-500 mt-1">Comunica l'apertura di un nuovo cantiere o aggiorna quelli esistenti.</p>
              </div>
              <div className="absolute right-6 h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-300 group-hover:bg-red-50 group-hover:text-[#D32F2F] transition-all">
                <Plus className="h-5 w-5" />
              </div>
            </button>
          )}
        </div>
      </section>

      {/* Altri Servizi Section */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <Settings className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Altri Servizi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white rounded-2xl border border-slate-100 p-6 flex gap-4 opacity-70 group hover:opacity-100 transition-opacity">
              <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-700">Gestione Cedolini</h4>
                <p className="text-sm text-slate-500">Visualizza e scarica i cedolini mensili dei tuoi dipendenti.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest">In Arrivo</span>
                </div>
              </div>
           </div>
           <div className="bg-white rounded-2xl border border-slate-100 p-6 flex gap-4 opacity-70 group hover:opacity-100 transition-opacity">
              <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-700">Comunicazioni Admin</h4>
                <p className="text-sm text-slate-500">Invia comunicazioni rapide al tuo consulente dedicato.</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full uppercase tracking-widest">In Arrivo</span>
                </div>
              </div>
           </div>
        </div>
      </section>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D32F2F] rounded-xl text-white">
                  {activeModal === 'sede' ? <Building2 className="h-6 w-6" /> : <Construction className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {activeModal === 'sede' ? 'Sede Operativa' : 'Anagrafica Cantieri'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {activeModal === 'sede' ? 'Dati della sede principale' : 'Elenco dei cantieri attivi'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {activeModal === 'sede' ? (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3 items-start">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-800 leading-relaxed">
                      I dati delle sedi sono configurati dall'amministratore e non sono modificabili direttamente. 
                      Per variazioni, contatta il tuo consulente.
                    </p>
                  </div>

                  <div className="overflow-x-auto -mx-8">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
                        <tr>
                          <th className="px-8 py-4">N°</th>
                          <th className="px-4 py-4">Comune</th>
                          <th className="px-4 py-4">Provincia</th>
                          <th className="px-8 py-4">Indirizzo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {/* Main Sede from profile */}
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5">
                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold italic">
                              {profile?.numero_sede || '1'}
                            </span>
                          </td>
                          <td className="px-4 py-5 font-semibold text-slate-800">{profile?.comune || '—'}</td>
                          <td className="px-4 py-5 text-slate-600 font-medium">{profile?.provincia || '—'}</td>
                          <td className="px-8 py-5 text-slate-500">{profile?.indirizzo || '—'}</td>
                        </tr>
                        {/* Additional Sedi */}
                        {additionalSedi?.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold italic">
                                {s.numero}
                              </span>
                            </td>
                            <td className="px-4 py-5 font-semibold text-slate-800">{s.comune}</td>
                            <td className="px-4 py-5 text-slate-600 font-medium">{s.provincia}</td>
                            <td className="px-8 py-5 text-slate-500">{s.indirizzo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Elenco Cantieri Attivi</h4>
                    {!viewingCantiere && (
                      <div className="flex gap-2">
                        <Link 
                          href="/cantieri/nuovo-appaltatore"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white rounded-xl text-xs font-bold hover:bg-[#b02727] transition-all shadow-lg shadow-red-900/10 group"
                        >
                          <Construction className="h-3.5 w-3.5" />
                          NUOVO CANTIERE (APPALTATORE)
                          <ArrowUpRight className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                        <button 
                          disabled
                          title="Prossimamente"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-bold cursor-not-allowed border border-slate-200"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          COME SUBAPPALTATORE
                        </button>
                      </div>
                    )}
                  </div>

                  {viewingCantiere ? (
                    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-200">
                      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-white rounded-xl border border-slate-200 text-[#D32F2F]">
                             <ClipboardList className="h-5 w-5" />
                           </div>
                           <h4 className="text-lg font-bold text-slate-900">Dettagli Cantiere</h4>
                         </div>
                         <button onClick={() => setViewingCantiere(null)} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-200 rounded-full transition-colors">
                           <X className="h-5 w-5" />
                         </button>
                      </div>

                      <div className="p-8 space-y-8">
                        {/* Sezione 1: Committente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-100">
                           <div className="space-y-4">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-3 w-3" /> Committente
                              </h5>
                              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                 <div>
                                   <p className="text-sm font-bold text-slate-900">{viewingCantiere.committente}</p>
                                   <p className="text-[10px] text-slate-500 uppercase">{viewingCantiere.tipo_committente?.replace('_', ' ')}</p>
                                 </div>
                                 <div className="grid grid-cols-2 gap-4 text-xs">
                                   <div>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">Codice Fiscale</p>
                                      <p className="font-mono text-slate-700">{viewingCantiere.committente_cf || '—'}</p>
                                   </div>
                                   {viewingCantiere.committente_piva && (
                                     <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Partita IVA</p>
                                        <p className="font-mono text-slate-700">{viewingCantiere.committente_piva}</p>
                                     </div>
                                   )}
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Indirizzo Sede</p>
                                    <p className="text-slate-600">{viewingCantiere.committente_via} {viewingCantiere.committente_civico}, {viewingCantiere.committente_comune} ({viewingCantiere.committente_provincia})</p>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> Ubicazione Cantiere
                              </h5>
                              <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                 <div>
                                   <p className="text-sm font-bold text-slate-900">{viewingCantiere.cantiere} {viewingCantiere.civico}</p>
                                   <p className="text-xs text-slate-600">{viewingCantiere.comune} ({viewingCantiere.prov}) — {viewingCantiere.cap}</p>
                                 </div>
                                 <div className="flex gap-2">
                                   <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">Dal: {viewingCantiere.da}</span>
                                   <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded uppercase">Al: {viewingCantiere.a}</span>
                                 </div>
                                 {viewingCantiere.sisma === 'SI' && (
                                   <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded italic">CANTIERE SISMA 2016</span>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* Sezione 2: Dati Tecnici */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-slate-100">
                           <div className="md:col-span-3 space-y-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Attività Svolta</p>
                              <p className="text-sm font-bold text-slate-800 leading-relaxed">{viewingCantiere.attivita_svolta || '—'}</p>
                           </div>
                           <div className="md:col-span-3 space-y-2">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Descrizione Lavori</p>
                              <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">{viewingCantiere.descrizione_lavori || 'Nessuna descrizione'}</p>
                           </div>
                           
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Importo Complessivo</p>
                              <p className="text-lg font-black text-slate-900">€ {viewingCantiere.importo_complessivo?.toLocaleString('it-IT') || '0,00'}</p>
                           </div>
                           <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase text-[#D32F2F]">Importo Lavori Edili</p>
                              <p className="text-lg font-black text-[#D32F2F]">€ {viewingCantiere.importo_lavori_edili?.toLocaleString('it-IT') || '0,00'}</p>
                           </div>
                           <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Autonomi</p>
                                <p className="font-bold text-slate-700">{viewingCantiere.n_autonomi || '0'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Imprese</p>
                                <p className="font-bold text-slate-700">{viewingCantiere.n_imprese || '0'}</p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Operai</p>
                                <p className="font-bold text-slate-700">{viewingCantiere.n_operai || '0'}</p>
                              </div>
                           </div>
                        </div>

                        {/* Sezione 3: Subappaltatori */}
                        {subs.length > 0 && (
                          <div className="space-y-4">
                            <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                              <Building2 className="h-3 w-3" /> Imprese Subappaltatrici ({subs.length})
                            </h5>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {subs.map((s) => (
                                <div key={s.id} className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{s.ragione_sociale}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">CF: {s.codice_fiscale}</p>
                                    <p className="text-[9px] text-emerald-600 font-bold mt-1 uppercase">{s.tipo_edile.replace('_', ' ')}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs font-black text-[#D32F2F]">€ {s.importo_edile?.toLocaleString('it-IT')}</p>
                                    {s.numero_iscrizione_ce && <p className="text-[9px] text-blue-600 font-bold">CE: {s.numero_iscrizione_ce}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-slate-50 px-8 py-4 flex justify-between items-center border-t border-slate-200">
                         <div className="flex gap-4">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">CIG: {viewingCantiere.cig || '—'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">CUP: {viewingCantiere.cup || '—'}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">GIS: {viewingCantiere.gis || '—'}</span>
                         </div>
                         <button 
                           onClick={() => setViewingCantiere(null)}
                           className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10"
                         >
                           CHIUDI DETTAGLIO
                         </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto -mx-8">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-y border-slate-100">
                          <tr>
                            <th className="px-8 py-4">Cod / GIS</th>
                            <th className="px-4 py-4">Cantiere</th>
                            <th className="px-4 py-4">Dettagli Località</th>
                            <th className="px-4 py-4">Committente / Appalto</th>
                            <th className="px-4 py-4 text-center">Periodo</th>
                            <th className="px-8 py-4 text-right">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {cantieri?.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group/tr">
                              <td className="px-8 py-5">
                                <div className="font-bold text-slate-900">{c.cod || '—'}</div>
                              </td>
                              <td className="px-4 py-5">
                                <div className="font-bold text-slate-800 uppercase text-xs">{c.cantiere}</div>
                                {c.sisma === 'SI' && (
                                  <div className="mt-1.5 inline-block text-[8px] font-black bg-red-100 text-red-700 px-1.5 py-0.5 rounded italic">SISMA</div>
                                )}
                              </td>
                              <td className="px-4 py-5">
                                <div className="text-slate-700 font-semibold text-xs uppercase">{c.comune}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.cap} ({c.prov})</div>
                              </td>
                              <td className="px-4 py-5">
                                <div className="text-slate-700 font-bold text-[11px] uppercase truncate max-w-[150px]">{c.committente || '—'}</div>
                                <div className="text-[9px] text-slate-400 mb-1 italic">CF: {c.cf_appaltatore || '—'}</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold">CIG: {c.cig || '—'}</span>
                                  <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold">CUP: {c.cup || '—'}</span>
                                  <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">{c.appalto_subappalto}</span>
                                </div>
                              </td>
                              <td className="px-4 py-5">
                                <div className="flex flex-col items-center justify-center bg-white rounded-xl p-2 border border-slate-200 group-hover/tr:border-slate-300 transition-all shadow-sm">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DAL</span>
                                    <span className="text-xs font-black text-slate-900">{c.da || '—'}</span>
                                  </div>
                                  <div className="h-px w-10 bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-1"></div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AL</span>
                                    <span className="text-xs font-black text-[#D32F2F]">{c.a || '—'}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button 
                                  onClick={() => setViewingCantiere(c)}
                                  className="p-2.5 text-slate-300 hover:text-[#D32F2F] hover:bg-red-50 rounded-xl transition-all shadow-sm hover:shadow-md bg-white border border-slate-100 flex items-center gap-2"
                                  title="Dettagli Cantiere"
                                >
                                  <Eye className="h-5 w-5" />
                                  <span className="text-[10px] font-bold uppercase">Apri</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(!cantieri || cantieri.length === 0) && (
                        <div className="py-20 text-center">
                          <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                            <Construction className="h-10 w-10 text-slate-300" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-900">Nessun cantiere registrato</h4>
                          <p className="text-slate-500 max-w-sm mx-auto mt-1">
                            Non ci sono cantieri attivi associati alla tua anagrafica.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
