'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Plus, 
  Trash2, 
  Building2, 
  Construction, 
  Users, 
  Info,
  AlertCircle,
  ArrowRight,
  Save
} from 'lucide-react'
import { submitDNL, SubmitDNLPayload, SubappaltatoreData } from '@/app/actions/submitDNL'
import { AddressPicker } from '@/components/common/AddressPicker'

const ATTIVITA_OPTIONS = [
  "1 OG 1 - Nuova edilizia civile, compresi impianti e forniture - 14,28%",
  "2 OG 1 - Nuova edilizia industriale, esclusi impianti - 5,36%",
  "3 Ristrutturazione di edifici civili - 22,00%",
  "4 Ristrutturazione di edifici industriali, esclusi impianti - 6,69%",
  "5 OG 2 - Restauro e manutenzione di beni tutelati - 30,00%",
  "6 OG 3 - Opere stradali, ponti, etc,. - 13,77%",
  "6 OG 3 - lavori di bitumatura - 6%",
  "6 OG 3 - spalatura neve - 6%",
  "7 OG 4 - Opere d'arte nel sottosuolo - 10,82%",
  "8 OG 5 - Dighe - 16,07%",
  "9 OG 6 - Acquedotti e fognature - 14,63%",
  "10 OG 6 - Gasdotti - 13,66%",
  "11 OG 6 - Oleodotti - 13,66%",
  "12 OG 6 - Opere di irrigazione ed evacuazione - 12,48%",
  "13 OG 7 - Opere marittime - 12,16%",
  "14 OG 8 - Opere fluviali - 13,31%",
  "15 OG 9 - Impianti per la produzione di energia elettrica - 14,23%",
  "16 OG 10 - Impianti per la trasformazione e distribuzione - 5,36%",
  "17 OG 12 - OG 13 - Bonifica e protezione ambientale - 16,47%"
]

export default function NuovoCantiereAppaltatore() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState<SubmitDNLPayload>({
    committente: {
      tipo: 'privato',
      cf: '',
      cognome: '',
      nome: '',
      ragione_sociale: '',
      piva: '',
      via: '',
      civico: '',
      cap: '',
      comune: '',
      provincia: '',
      cup: ''
    },
    cantiere: {
      via: '',
      civico: '',
      cap: '',
      comune: '',
      prov: '',
      sisma: false,
      attivita_svolta: ATTIVITA_OPTIONS[2], // Voce 3 default
      descrizione_lavori: '',
      data_inizio: '',
      data_fine: '',
      importo_complessivo: '',
      importo_lavori_edili: '',
      importo_contratto: '',
      n_autonomi: '0',
      n_imprese: '0',
      n_operai: '0',
      nota: ''
    },
    subappaltatori: []
  })

  const nextStep = () => setStep(s => Math.min(s + 1, 3))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const addSub = () => {
    const newSub: SubappaltatoreData = {
      ragione_sociale: '',
      codice_fiscale: '',
      partita_iva: '',
      via: '',
      civico: '',
      cap: '',
      comune: '',
      provincia: '',
      telefono: '',
      email: '',
      tipo_edile: 'edile',
      numero_iscrizione_ce: '',
      tipo_lavoro: 'Subappalto',
      attivita_svolta: ATTIVITA_OPTIONS[2],
      data_inizio_presunta: '',
      data_fine_presunta: '',
      descrizione_lavori: '',
      importo_edile: '',
      lavoratore_autonomo: false
    }
    setFormData(d => ({ ...d, subappaltatori: [...d.subappaltatori, newSub] }))
  }

  const removeSub = (index: number) => {
    setFormData(d => ({
      ...d,
      subappaltatori: d.subappaltatori.filter((_, i) => i !== index)
    }))
  }

  const updateSub = (index: number, fields: Partial<SubappaltatoreData>) => {
    setFormData(d => ({
      ...d,
      subappaltatori: d.subappaltatori.map((s, i) => i === index ? { ...s, ...fields } : s)
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await submitDNL(formData)
      if (res.success) {
        router.push('/')
        router.refresh()
      } else {
        setError(res.error || 'Errore durante il salvataggio')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Denuncia Nuovo Lavoro</h1>
          <p className="mt-2 text-slate-500 font-medium">Compila i dati per l'apertura del nuovo cantiere come Appaltatore</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-[#D32F2F] -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
          <div className="relative z-10 flex justify-between">
            {[0, 1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 ${
                  step >= s ? 'bg-[#D32F2F] border-[#D32F2F] text-white' : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s + 1}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Committente</span>
            <span>Cantiere</span>
            <span>Subappalti</span>
            <span>Conferma</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex gap-3 items-center text-red-800 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8">
            {step === 0 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex flex-col gap-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Tipologia Committente</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { id: 'privato', label: 'Privato Cittadino' },
                        { id: 'ente_pubblico', label: 'Ente Pubblico' },
                        { id: 'azienda_privata', label: 'Azienda Privata' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFormData({ ...formData, committente: { ...formData.committente, tipo: t.id as any } })}
                          className={`px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                            formData.committente.tipo === t.id 
                            ? 'border-[#D32F2F] bg-red-50 text-[#D32F2F]' 
                            : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.committente.tipo === 'privato' ? (
                      <>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Cognome *</label>
                          <input 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#D32F2F]/20 outline-none transition-all"
                            value={formData.committente.cognome}
                            onChange={(e) => setFormData({ ...formData, committente: { ...formData.committente, cognome: e.target.value } })}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Nome *</label>
                          <input 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#D32F2F]/20 outline-none transition-all"
                            value={formData.committente.nome}
                            onChange={(e) => setFormData({ ...formData, committente: { ...formData.committente, nome: e.target.value } })}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Ragione Sociale *</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#D32F2F]/20 outline-none transition-all"
                          value={formData.committente.ragione_sociale}
                          onChange={(e) => setFormData({ ...formData, committente: { ...formData.committente, ragione_sociale: e.target.value } })}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Codice Fiscale *</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#D32F2F]/20 outline-none transition-all font-mono"
                        value={formData.committente.cf}
                        onChange={(e) => setFormData({ ...formData, committente: { ...formData.committente, cf: e.target.value.toUpperCase() } })}
                      />
                    </div>
                    {formData.committente.tipo !== 'privato' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Partita IVA</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#D32F2F]/20 outline-none transition-all font-mono"
                          value={formData.committente.piva}
                          onChange={(e) => setFormData({ ...formData, committente: { ...formData.committente, piva: e.target.value } })}
                        />
                      </div>
                    )}
                    {formData.committente.tipo === 'ente_pubblico' && (
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-tighter text-[#D32F2F] ml-1">Codice Unico Progetto (CUP) *</label>
                        <input 
                          className="w-full px-4 py-3 rounded-xl border border-[#D32F2F]/30 bg-red-50/30 focus:ring-2 focus:ring-[#D32F2F]/20 outline-none transition-all font-mono font-bold"
                          placeholder="Obbligatorio per enti pubblici"
                          value={formData.committente.cup}
                          onChange={(e) => setFormData({ ...formData, committente: { ...formData.committente, cup: e.target.value.toUpperCase() } })}
                        />
                      </div>
                    )}
                  </div>

                  <AddressPicker 
                    label="Indirizzo Committente"
                    value={{
                      via: formData.committente.via,
                      civico: formData.committente.civico,
                      comune: formData.committente.comune,
                      provincia: formData.committente.provincia,
                      cap: formData.committente.cap
                    }}
                    onChange={(fields) => setFormData({ 
                      ...formData, 
                      committente: { ...formData.committente, ...fields } 
                    })}
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                      <AddressPicker 
                        label="Ubicazione Cantiere"
                        value={{
                          via: formData.cantiere.via,
                          civico: formData.cantiere.civico,
                          comune: formData.cantiere.comune,
                          provincia: formData.cantiere.prov, // Mappiamo prov -> provincia
                          cap: formData.cantiere.cap
                        }}
                        onChange={(fields) => {
                          const updatedFields = { ...fields };
                          if (fields.provincia) {
                            (updatedFields as any).prov = fields.provincia;
                            delete updatedFields.provincia;
                          }
                          setFormData({ 
                            ...formData, 
                            cantiere: { ...formData.cantiere, ...updatedFields } 
                          });
                        }}
                      />

                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <span className="text-sm font-bold text-amber-900">Cantiere Sisma 2016</span>
                      </div>
                      <button 
                        onClick={() => setFormData({ ...formData, cantiere: { ...formData.cantiere, sisma: !formData.cantiere.sisma } })}
                        className={`w-12 h-6 rounded-full p-1 transition-all ${formData.cantiere.sisma ? 'bg-amber-500' : 'bg-slate-300'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-all ${formData.cantiere.sisma ? 'translate-x-6' : 'translate-x-0'}`}></div>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Attività Svolta *</label>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black rounded uppercase">Suggerita per ristrutturazioni</span>
                      </div>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium text-sm appearance-none bg-white"
                        value={formData.cantiere.attivita_svolta}
                        onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, attivita_svolta: e.target.value } })}
                      >
                        {ATTIVITA_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Descrizione Lavori (max 200 car.) *</label>
                      <textarea 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none h-24 text-sm resize-none"
                        maxLength={200}
                        value={formData.cantiere.descrizione_lavori}
                        onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, descrizione_lavori: e.target.value } })}
                      />
                      <div className="text-right text-[10px] font-bold text-slate-400">
                        {formData.cantiere.descrizione_lavori.length} / 200
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Data Inizio *</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm"
                          value={formData.cantiere.data_inizio}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, data_inizio: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Data Fine *</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm"
                          value={formData.cantiere.data_fine}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, data_fine: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500 uppercase tracking-tighter">Importo Complessivo Lavori (€) *</span>
                          <input 
                            className="w-32 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-right font-bold outline-none"
                            placeholder="0,00"
                            value={formData.cantiere.importo_complessivo}
                            onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, importo_complessivo: e.target.value } })}
                          />
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-500 uppercase tracking-tighter">Importo Lavori Edili (lordo sub) *</span>
                          <input 
                            className="w-32 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-right font-bold outline-none text-[#D32F2F]"
                            placeholder="0,00"
                            value={formData.cantiere.importo_lavori_edili}
                            onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, importo_lavori_edili: e.target.value } })}
                          />
                       </div>
                       <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-tighter italic">Importo Contratto (€)</span>
                          <input 
                            className="w-32 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-right font-medium outline-none text-slate-400"
                            placeholder="0,00"
                            value={formData.cantiere.importo_contratto}
                            onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, importo_contratto: e.target.value } })}
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-tighter text-slate-400 ml-1">N° Autonomi</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-center"
                          value={formData.cantiere.n_autonomi}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, n_autonomi: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-tighter text-slate-400 ml-1">N° Imprese</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-center"
                          value={formData.cantiere.n_imprese}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, n_imprese: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-tighter text-slate-400 ml-1">N° Operai</label>
                        <input 
                          type="number"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-center"
                          value={formData.cantiere.n_operai}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, n_operai: e.target.value } })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold text-slate-900">Imprese Subappaltatrici</h3>
                   <button 
                    onClick={addSub}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
                   >
                     <Plus className="h-4 w-4" />
                     AGGIUNGI SUBAPPALTO
                   </button>
                </div>

                {formData.subappaltatori.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                     <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                     <p className="text-slate-400 font-medium italic">Nessun subappaltatore aggiunto. Puoi procedere oltre se il cantiere non ne ha.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.subappaltatori.map((sub, index) => (
                      <div key={index} className="group relative bg-slate-50 border border-slate-200 rounded-3xl p-6 transition-all hover:border-slate-300">
                        <button 
                          onClick={() => removeSub(index)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white text-red-500 rounded-full flex items-center justify-center shadow-md border border-slate-100 hover:bg-red-50 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                  onClick={() => updateSub(index, { tipo_edile: 'edile' })}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                    sub.tipo_edile === 'edile' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >EDILE</button>
                                <button 
                                  onClick={() => updateSub(index, { tipo_edile: 'non_edile' })}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                    sub.tipo_edile === 'non_edile' ? 'bg-slate-600 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                                  }`}
                                >NON EDILE</button>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Ragione Sociale *</label>
                              <input 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm bg-white"
                                value={sub.ragione_sociale}
                                onChange={(e) => updateSub(index, { ragione_sociale: e.target.value })}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Codice Fiscale *</label>
                                <input 
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-mono bg-white"
                                  value={sub.codice_fiscale}
                                  onChange={(e) => updateSub(index, { codice_fiscale: e.target.value.toUpperCase() })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Partita IVA</label>
                                <input 
                                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-sm font-mono bg-white"
                                  value={sub.partita_iva}
                                  onChange={(e) => updateSub(index, { partita_iva: e.target.value })}
                                />
                              </div>
                            </div>

                            {sub.tipo_edile === 'edile' && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-tighter text-[#D32F2F] ml-1">N° Iscrizione Cassa Edile (prov. cantiere) *</label>
                                <input 
                                  className="w-full px-4 py-2.5 rounded-xl border border-[#D32F2F]/30 bg-white outline-none text-sm font-bold text-[#D32F2F]"
                                  value={sub.numero_iscrizione_ce}
                                  onChange={(e) => updateSub(index, { numero_iscrizione_ce: e.target.value })}
                                />
                              </div>
                            )}

                             <AddressPicker 
                                label="Indirizzo Subappalto"
                                value={{
                                  via: sub.via,
                                  civico: sub.civico,
                                  comune: sub.comune,
                                  provincia: sub.provincia,
                                  cap: sub.cap
                                }}
                                onChange={(fields) => updateSub(index, fields)}
                             />
                          </div>

                          <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Data Inizio Presunta *</label>
                                  <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-xs bg-white" value={sub.data_inizio_presunta} onChange={(e)=>updateSub(index,{data_inizio_presunta:e.target.value})}/>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Data Fine Presunta *</label>
                                  <input type="date" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none text-xs bg-white" value={sub.data_fine_presunta} onChange={(e)=>updateSub(index,{data_fine_presunta:e.target.value})}/>
                                </div>
                             </div>

                             <div className="space-y-1">
                               <label className="text-[10px] font-black uppercase tracking-tighter text-slate-400 ml-1">Descrizione Lavori Subappalto *</label>
                               <textarea 
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none h-16 text-xs resize-none bg-white"
                                value={sub.descrizione_lavori}
                                onChange={(e) => updateSub(index, { descrizione_lavori: e.target.value })}
                               />
                             </div>

                             <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Importo Edile (€) *</span>
                                <input 
                                  className="w-24 text-right font-bold text-sm outline-none"
                                  placeholder="0,00"
                                  value={sub.importo_edile}
                                  onChange={(e) => updateSub(index, { importo_edile: e.target.value })}
                                />
                             </div>

                             <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-2">
                                   <input 
                                    type="checkbox" 
                                    className="w-4 h-4 accent-[#D32F2F]"
                                    checked={sub.lavoratore_autonomo}
                                    onChange={(e) => updateSub(index, { lavoratore_autonomo: e.target.checked })}
                                   />
                                   <label className="text-xs font-bold text-slate-600">Lavoratore Autonomo</label>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10 animate-in fade-in zoom-in-95">
                <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-200">
                   <div className="w-16 h-16 bg-[#D32F2F]/10 text-[#D32F2F] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Save className="h-8 w-8" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pronto per l'invio?</h3>
                   <p className="text-slate-500 font-medium mt-2">Controlla i dati un'ultima volta prima di confermare. Il cantiere verrà aggiunto alla tua lista e una copia verrà inviata al consulente.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3 mb-4 text-[#D32F2F]">
                         <Users className="h-5 w-5" />
                         <span className="text-xs font-black uppercase tracking-widest">Committente</span>
                      </div>
                      <div className="space-y-2">
                         <p className="text-lg font-bold text-slate-900">
                           {formData.committente.tipo === 'privato' 
                            ? `${formData.committente.cognome} ${formData.committente.nome}`
                            : formData.committente.ragione_sociale}
                         </p>
                         <p className="text-xs font-mono text-slate-500">CF: {formData.committente.cf}</p>
                         <p className="text-sm text-slate-600">{formData.committente.via} {formData.committente.civico}, {formData.committente.comune} ({formData.committente.provincia})</p>
                      </div>
                   </div>

                   <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3 mb-4 text-[#D32F2F]">
                         <Construction className="h-5 w-5" />
                         <span className="text-xs font-black uppercase tracking-widest">Ubicazione Cantiere</span>
                      </div>
                      <div className="space-y-2">
                         <p className="text-lg font-bold text-slate-900">{formData.cantiere.via} {formData.cantiere.civico}</p>
                         <p className="text-sm text-slate-600">{formData.cantiere.comune} ({formData.cantiere.prov}) — {formData.cantiere.cap}</p>
                         <div className="flex gap-2 pt-2">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black rounded uppercase">
                               Inizio: {formData.cantiere.data_inizio}
                            </span>
                            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-black rounded uppercase">
                               Fine: {formData.cantiere.data_fine}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-emerald-600">
                         <Building2 className="h-5 w-5" />
                         <span className="text-xs font-black uppercase tracking-widest">Subappaltatori ({formData.subappaltatori.length})</span>
                      </div>
                   </div>
                   {formData.subappaltatori.length > 0 ? (
                     <div className="divide-y divide-slate-100">
                        {formData.subappaltatori.map((s, i) => (
                          <div key={i} className="py-3 flex justify-between items-center text-sm">
                             <div>
                                <p className="font-bold text-slate-800">{s.ragione_sociale}</p>
                                <p className="text-[10px] text-slate-400 font-mono italic">{s.codice_fiscale}</p>
                             </div>
                             <div className="text-right">
                                <p className="font-black text-[#D32F2F]">€ {s.importo_edile}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{s.tipo_edile}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-400 italic">Nessun subappaltatore dichiarato.</p>
                   )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <button 
              onClick={step === 0 ? () => router.push('/') : prevStep}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
              {step === 0 ? 'ANNULLA' : 'INDIETRO'}
            </button>

            {step < 3 ? (
              <button 
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
              >
                AVANTI
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group relative flex items-center gap-3 px-10 py-4 bg-[#D32F2F] text-white rounded-2xl text-base font-black hover:bg-[#b02727] transition-all shadow-2xl shadow-red-900/20 disabled:bg-slate-400 overflow-hidden"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    INVIO IN CORSO...
                  </div>
                ) : (
                  <>
                    <Check className="h-6 w-6 group-hover:scale-125 transition-transform" />
                    CONFERMA E INVIA DNL
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
