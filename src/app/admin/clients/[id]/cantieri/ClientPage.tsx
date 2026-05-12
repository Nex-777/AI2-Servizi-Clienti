'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Construction, MapPin, Users, Calendar, ClipboardList, Building2, Info, Calculator, FileText, ArrowLeft } from 'lucide-react'
import { addCantiere, updateCantiere, deleteCantiere } from './actions'
import { AddressPicker } from '@/components/common/AddressPicker'

export default function ClientCantieriPage({ 
  clientId, 
  client,
  initialCantieri,
  nextCodeDisplay
}: { 
  clientId: string
  client: any
  initialCantieri: any[] 
  nextCodeDisplay?: string
}) {
  const [cantieri, setCantieri] = useState(initialCantieri || [])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCantiere, setEditingCantiere] = useState<any | null>(null)
  const [subs, setSubs] = useState<any[]>([])

  // Stato per gli indirizzi (Cantiere e Committente)
  const [cantiereAddr, setCantiereAddr] = useState({
    via: '', civico: '', cap: '', comune: '', provincia: ''
  })
  const [committenteAddr, setCommittenteAddr] = useState({
    via: '', civico: '', cap: '', comune: '', provincia: ''
  })

  useEffect(() => {
    if (editingCantiere) {
      setCantiereAddr({
        via: editingCantiere.cantiere || '',
        civico: editingCantiere.civico || '',
        cap: editingCantiere.cap || '',
        comune: editingCantiere.comune || '',
        provincia: editingCantiere.prov || ''
      })
      setCommittenteAddr({
        via: editingCantiere.committente_via || '',
        civico: editingCantiere.committente_civico || '',
        cap: editingCantiere.committente_cap || '',
        comune: editingCantiere.committente_comune || '',
        provincia: editingCantiere.committente_provincia || ''
      })

      if (editingCantiere.id) {
        const fetchSubs = async () => {
          const { createClient } = await import('@/utils/supabase/client')
          const supabase = createClient()
          const { data } = await supabase
            .from('subappaltatori_cantiere')
            .select('*')
            .eq('cantiere_id', editingCantiere.id)
          setSubs(data || [])
        }
        fetchSubs()
      }
    } else {
      setSubs([])
      setCantiereAddr({ via: '', civico: '', cap: '', comune: '', provincia: '' })
      setCommittenteAddr({ via: '', civico: '', cap: '', comune: '', provincia: '' })
    }
  }, [editingCantiere, isModalOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    try {
      if (editingCantiere) {
        await updateCantiere(clientId, editingCantiere.id, formData)
      } else {
        await addCantiere(clientId, formData)
      }
      window.location.reload()
    } catch (error) {
      alert('Errore nel salvataggio del cantiere')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo cantiere?')) {
      try {
        await deleteCantiere(clientId, id)
        window.location.reload()
      } catch (error) {
        alert('Errore nell\'eliminazione del cantiere')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = '/admin/clients'}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Torna alla lista clienti"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Gestione Cantieri</h2>
            <p className="text-sm text-slate-500">Configura i cantieri attivi per questo cliente</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setEditingCantiere(null)
            setIsModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#D32F2F] text-white rounded-xl hover:bg-[#B71C1C] transition-colors font-bold shadow-lg shadow-red-900/10"
        >
          <Plus className="h-5 w-5" />
          NUOVO CANTIERE
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {cantieri.map((c) => (
          <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#D32F2F]/30 transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="p-3 bg-red-50 rounded-2xl text-[#D32F2F] group-hover:scale-110 transition-transform">
                  <Construction className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">{c.cantiere}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded uppercase tracking-tighter">
                      {c.cod || 'SENZA CODICE'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {c.comune} ({c.prov})
                    </div>
                    {c.distanza_km && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        <Calculator className="h-3.5 w-3.5" />
                        {c.distanza_km.toFixed(1)} km
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Users className="h-4 w-4" />
                      {c.committente}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingCantiere(c)
                    setIsModalOpen(true)
                  }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#D32F2F] rounded-xl text-white">
                  <Construction className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {editingCantiere ? 'Modifica Cantiere' : 'Nuovo Cantiere'}
                  </h3>
                  <p className="text-sm text-slate-500">Configurazione completa dei dati di cantiere</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
              {/* SEZIONE 1: DATI GENERALI E UBICAZIONE */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> UBICAZIONE E CODICI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-4">
                    <AddressPicker 
                      type="cantiere"
                      label="Ubicazione Cantiere"
                      value={cantiereAddr}
                      onChange={(f) => setCantiereAddr(p => ({ ...p, ...f }))}
                    />
                    {/* Hidden inputs per la server action */}
                    <input type="hidden" name="cantiere" value={cantiereAddr.via} />
                    <input type="hidden" name="civico" value={cantiereAddr.civico} />
                    <input type="hidden" name="cap" value={cantiereAddr.cap} />
                    <input type="hidden" name="comune" value={cantiereAddr.comune} />
                    <input type="hidden" name="prov" value={cantiereAddr.provincia} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Sisma 2016</label>
                    <select name="sisma" defaultValue={editingCantiere?.sisma || 'NO'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold">
                      <option value="NO">NO</option>
                      <option value="SI">SI</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase text-blue-600">Codice Cantiere (Segnatempo)</label>
                    <input 
                      name="cod" 
                      defaultValue={editingCantiere?.cod} 
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/30 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-blue-700 placeholder:text-blue-400/70 placeholder:font-medium" 
                      placeholder={editingCantiere ? "Lascia vuoto per non modificare" : (nextCodeDisplay ? `Lascia vuoto per auto-assegnazione (es. ${nextCodeDisplay})` : "Esempio: Z01")} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase text-emerald-600">Codice Univoco CE</label>
                    <input name="cod_univoco" defaultValue={editingCantiere?.cod_univoco} className="w-full px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50/30 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-emerald-700" />
                  </div>
                </div>
              </div>

              {/* SEZIONE 2: ANAGRAFICA COMMITTENTE */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Users className="h-4 w-4" /> ANAGRAFICA COMMITTENTE
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ragione Sociale / Nominativo</label>
                    <input name="committente" defaultValue={editingCantiere?.committente} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tipo Committente</label>
                    <select name="tipo_committente" defaultValue={editingCantiere?.tipo_committente || 'privato'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold">
                      <option value="privato">Persona Fisica / Privato</option>
                      <option value="ditta_ente">Ditta / Ente Pubblico</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Codice Fiscale</label>
                    <input name="committente_cf" defaultValue={editingCantiere?.committente_cf} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Partita IVA</label>
                    <input name="committente_piva" defaultValue={editingCantiere?.committente_piva} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono" />
                  </div>
                  <div className="md:col-span-3">
                    <AddressPicker 
                      type="sede"
                      label="Sede Committente"
                      value={committenteAddr}
                      onChange={(f) => setCommittenteAddr(p => ({ ...p, ...f }))}
                    />
                    {/* Hidden inputs per la server action */}
                    <input type="hidden" name="committente_via" value={committenteAddr.via} />
                    <input type="hidden" name="committente_civico" value={committenteAddr.civico} />
                    <input type="hidden" name="committente_cap" value={committenteAddr.cap} />
                    <input type="hidden" name="committente_comune" value={committenteAddr.comune} />
                    <input type="hidden" name="committente_provincia" value={committenteAddr.provincia} />
                  </div>
                </div>
              </div>

              {/* SEZIONE 3: DATI APPALTO E IMPORTI */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> APPALTO E VALORI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Attività Svolta</label>
                    <input name="attivita_svolta" defaultValue={editingCantiere?.attivita_svolta} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">CIG</label>
                    <input name="cig" defaultValue={editingCantiere?.cig} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">CUP</label>
                    <input name="cup" defaultValue={editingCantiere?.cup} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Importo Complessivo (€)</label>
                    <input name="importo_complessivo" defaultValue={editingCantiere?.importo_complessivo} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Importo Edile (€)</label>
                    <input name="importo_lavori_edili" defaultValue={editingCantiere?.importo_lavori_edili} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-red-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Importo Contratto (€)</label>
                    <input name="importo_contratto" defaultValue={editingCantiere?.importo_contratto} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold text-emerald-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Tipo Lavoro</label>
                    <select name="appalto_subappalto" defaultValue={editingCantiere?.appalto_subappalto || 'Appalto'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold">
                      <option value="Appalto">Appalto</option>
                      <option value="Subappalto">Subappalto</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Data Inizio</label>
                    <input type="date" name="da" defaultValue={editingCantiere?.da} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Data Fine Prevista</label>
                    <input type="date" name="a" defaultValue={editingCantiere?.a} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" required />
                  </div>
                </div>
              </div>

              {/* SEZIONE 4: TECNICI E STATO */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> TECNICI E STATO DNL
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">N° Autonomi</label>
                    <input type="number" name="n_autonomi" defaultValue={editingCantiere?.n_autonomi || 0} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">N° Imprese</label>
                    <input type="number" name="n_imprese" defaultValue={editingCantiere?.n_imprese || 0} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">N° Operai</label>
                    <input type="number" name="n_operai" defaultValue={editingCantiere?.n_operai || 0} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Stato DNL</label>
                    <select name="dnl_status" defaultValue={editingCantiere?.dnl_status || 'da_inviare'} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-bold">
                      <option value="da_inviare">DA INVIARE (MUT)</option>
                      <option value="inviata">INVIATA</option>
                      <option value="errore">ERRORE</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Descrizione Lavori</label>
                    <textarea name="descrizione_lavori" defaultValue={editingCantiere?.descrizione_lavori} rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all" />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase text-amber-600">Note Interne Admin / Consulente</label>
                    <textarea name="nota" defaultValue={editingCantiere?.nota} rows={2} className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-amber-50/20 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all" />
                  </div>
                </div>
              </div>

              {/* SEZIONE 5: SUBAPPALTATORI (SOLO VISUALIZZAZIONE) */}
              {subs.length > 0 && (
                <div className="space-y-6 pt-10 border-t border-slate-100">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Building2 className="h-4 w-4" /> SUBAPPALTATORI COLLEGATI ({subs.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subs.map((s) => (
                      <div key={s.id} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{s.ragione_sociale}</p>
                          <p className="text-[10px] text-slate-500">CF: {s.codice_fiscale}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#D32F2F]">€ {s.importo_edile?.toLocaleString('it-IT')}</p>
                          <span className="text-[9px] font-bold text-emerald-600 uppercase">{s.tipo_edile.replace('_', ' ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center sticky bottom-0 z-10">
               <p className="text-xs text-slate-400 italic">
                 {editingCantiere ? `Ultima modifica: ${new Date(editingCantiere.updated_at || editingCantiere.created_at).toLocaleString('it-IT')}` : 'Stai creando un nuovo cantiere'}
               </p>
               <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  ANNULLA
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-[#D32F2F] text-white rounded-xl text-sm font-bold hover:bg-[#B71C1C] transition-all shadow-lg shadow-red-900/20"
                >
                  SALVA CANTIERE
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}
    </div>
  )
}
