'use client'

import { Calendar, Clock, Lock, FileEdit, Eye, ChevronRight, LayoutDashboard, Settings, Users, MessageSquare } from 'lucide-react'

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
  onSelectFoglio 
}: { 
  userEmail: string
  fogli: FoglioSummary[]
  onSelectFoglio: (id: string) => void
}) {
  
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

      {/* Altri Servizi Placeholder */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white rounded-lg border border-slate-200">
            <Settings className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Altri Servizi</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
           <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 flex gap-4 grayscale">
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-700">Gestione Cedolini</h4>
                <p className="text-sm text-slate-500">Visualizza e scarica i cedolini mensili dei tuoi dipendenti.</p>
                <span className="inline-block mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Arrivo</span>
              </div>
           </div>
           <div className="bg-slate-100 rounded-2xl border border-slate-200 p-6 flex gap-4 grayscale">
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-700">Comunicazioni Admin</h4>
                <p className="text-sm text-slate-500">Invia comunicazioni rapide al tuo consulente dedicato.</p>
                <span className="inline-block mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">In Arrivo</span>
              </div>
           </div>
        </div>
      </section>
    </div>
  )
}
