'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Construction, 
  Building2, 
  Info,
  AlertCircle,
  Save,
  MapPin,
  Calendar,
  Calculator
} from 'lucide-react'
import { submitDNL, SubmitDNLPayload } from '@/app/actions/submitDNL'
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

function NuovoCantiereSubappaltoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawClientId = searchParams.get('clientId')
  const clientId = (rawClientId && rawClientId !== 'undefined') ? rawClientId : undefined
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ sede_comune: string; sede_provincia: string } | null>(null)

  // Form State optimized for Subappalto
  const [formData, setFormData] = useState<SubmitDNLPayload>({
    appalto_subappalto: 'Subappalto',
    appaltatore: {
      ragione_sociale: '',
      cf_piva: ''
    },
    committente: {
      tipo: 'azienda_privata', // Default per compatibilità
      cf: '',
      cognome: '',
      nome: '',
      ragione_sociale: '',
      piva: '',
      via: '-',
      civico: '-',
      cap: '-',
      comune: '-',
      provincia: '-',
      cup: '',
    },
    cantiere: {
      via: '',
      civico: '',
      cap: '',
      comune: '',
      prov: '',
      sisma: false,
      attivita_svolta: ATTIVITA_OPTIONS[2],
      descrizione_lavori: '',
      data_inizio: '',
      data_fine: '',
      importo_complessivo: '',
      importo_lavori_edili: '',
      importo_contratto: '',
      n_autonomi: '0',
      n_imprese: '0',
      n_operai: '0',
      nota: '',
      distanza_km: null
    },
    subappaltatori: [] // In subappalto di solito non si hanno altri subappaltatori subito, ma lasciamo vuoto
  })

  // Fetch profile to get sede_comune
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('sede_comune, sede_provincia')
        .eq('id', clientId || user.id)
        .single()
      
      if (profile) {
        setUserProfile(profile)
      }
    }
    fetchProfile()
  }, [clientId])

  const nextStep = () => {
    // Validazione base per step
    if (step === 0) {
      if (!formData.appaltatore?.ragione_sociale || !formData.appaltatore?.cf_piva) {
        setError("Inserire i dati dell'appaltatore")
        return
      }
    }
    if (step === 1) {
      if (!formData.cantiere.via || !formData.cantiere.comune || !formData.cantiere.data_inizio || !formData.cantiere.data_fine) {
        setError("Inserire i dati obbligatori del cantiere")
        return
      }
    }
    setError(null)
    setStep(s => Math.min(s + 1, 2))
  }
  
  const prevStep = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Per compatibilità con submitDNL legacy, copiamo i dati dell'appaltatore nel committente
      const finalData: SubmitDNLPayload = {
        ...formData,
        clientId,
        committente: {
          ...formData.committente,
          ragione_sociale: formData.appaltatore?.ragione_sociale || '',
          cf: formData.appaltatore?.cf_piva || '',
          piva: formData.appaltatore?.cf_piva || ''
        }
      }
      
      const res = await submitDNL(finalData)
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
          <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-700 rounded-2xl mb-4">
             <Building2 className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Nuovo Cantiere in Subappalto</h1>
          <p className="mt-2 text-slate-500 font-medium">Caricamento anagrafica cantiere per lavoratori in subappalto</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(step / 2) * 100}%` }}
          ></div>
          <div className="relative z-10 flex justify-between">
            {[0, 1, 2].map((s) => (
              <div 
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 ${
                  step >= s ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s + 1}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Appaltatore</span>
            <span>Cantiere</span>
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
                <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 flex gap-4">
                   <div className="p-2 bg-white rounded-xl shadow-sm text-emerald-600">
                      <Info className="h-5 w-5" />
                   </div>
                   <p className="text-sm text-emerald-900 leading-relaxed font-medium">
                     Inserisci i dati della ditta <b>Appaltatrice</b> (chi ha affidato il lavoro alla tua impresa).
                   </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ragione Sociale Appaltatore *</label>
                    <input 
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-800 bg-slate-50/30"
                      placeholder="Esempio: IMPRESA EDILE BIANCHI SRL"
                      value={formData.appaltatore?.ragione_sociale}
                      onChange={(e) => setFormData({ ...formData, appaltatore: { ...formData.appaltatore!, ragione_sociale: e.target.value.toUpperCase() } })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Codice Fiscale o Partita IVA *</label>
                    <input 
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold text-emerald-700 bg-slate-50/30"
                      placeholder="01234567890"
                      value={formData.appaltatore?.cf_piva}
                      onChange={(e) => setFormData({ ...formData, appaltatore: { ...formData.appaltatore!, cf_piva: e.target.value.toUpperCase() } })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                      <AddressPicker 
                        type="cantiere"
                        label="Ubicazione Cantiere"
                        sedeComune={userProfile?.sede_comune}
                        sedeProvincia={userProfile?.sede_provincia}
                        value={{
                          via: formData.cantiere.via,
                          civico: formData.cantiere.civico,
                          comune: formData.cantiere.comune,
                          provincia: formData.cantiere.prov,
                          cap: formData.cantiere.cap,
                          distanza_km: formData.cantiere.distanza_km
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 ml-1">Codice Univoco CNCE *</label>
                      <input 
                        className="w-full px-5 py-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-mono font-bold text-emerald-800"
                        placeholder="Esempio: CNCEC9012..."
                        value={formData.cantiere.cod_univoco}
                        onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, cod_univoco: e.target.value.toUpperCase() } })}
                      />
                      <p className="text-[10px] text-slate-400 mt-1 italic">Codice fornito dall'appaltatore principale</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Inizio *</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-white"
                          value={formData.cantiere.data_inizio}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, data_inizio: e.target.value } })}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Fine Prevista *</label>
                        <input 
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm bg-white"
                          value={formData.cantiere.data_fine}
                          onChange={(e) => setFormData({ ...formData, cantiere: { ...formData.cantiere, data_fine: e.target.value } })}
                        />
                      </div>
                    </div>

                    <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100 flex flex-col gap-1">
                       <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Informazione</p>
                       <p className="text-xs text-emerald-900">Le date di inizio e fine sono indicative per la pianificazione delle presenze.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in zoom-in-95">
                <div className="text-center p-8 bg-emerald-50/50 rounded-3xl border border-emerald-100">
                   <div className="w-16 h-16 bg-white text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Save className="h-8 w-8" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">Riepilogo Cantiere</h3>
                   <p className="text-slate-500 font-medium mt-2">Controlla i dati del subappalto prima del salvataggio finale.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3 mb-4 text-emerald-600">
                         <Building2 className="h-5 w-5" />
                         <span className="text-xs font-black uppercase tracking-widest">Appaltatore</span>
                      </div>
                      <div className="space-y-2">
                         <p className="text-lg font-black text-slate-900">{formData.appaltatore?.ragione_sociale}</p>
                         <p className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded inline-block">CF/PI: {formData.appaltatore?.cf_piva}</p>
                      </div>
                   </div>

                   <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                      <div className="flex items-center gap-3 mb-4 text-emerald-600">
                         <Construction className="h-5 w-5" />
                         <span className="text-xs font-black uppercase tracking-widest">Cantiere</span>
                      </div>
                      <div className="space-y-2">
                         <p className="text-lg font-bold text-slate-900">{formData.cantiere.via} {formData.cantiere.civico}</p>
                         <p className="text-sm text-slate-600 font-medium">{formData.cantiere.comune} ({formData.cantiere.prov}) — {formData.cantiere.cap}</p>
                         <div className="flex gap-2 pt-2">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded uppercase">
                               Dal: {formData.cantiere.data_inizio}
                            </span>
                            <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-black rounded uppercase">
                               Al: {formData.cantiere.data_fine}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-3 text-amber-700 mb-2">
                       <Info className="h-5 w-5" />
                       <span className="text-xs font-black uppercase tracking-widest">Codice CNCE</span>
                    </div>
                    <p className="text-lg font-mono font-bold text-slate-800">{formData.cantiere.cod_univoco || '-'}</p>
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

            {step < 2 ? (
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
                className="group relative flex items-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl text-base font-black hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-900/20 disabled:bg-slate-400 overflow-hidden"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    SALVATAGGIO...
                  </div>
                ) : (
                  <>
                    <Check className="h-6 w-6 group-hover:scale-125 transition-transform" />
                    SALVA E CONFERMA
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

export default function NuovoCantiereSubappalto() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>}>
      <NuovoCantiereSubappaltoContent />
    </Suspense>
  )
}
