'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { ChevronDown, CheckCircle, Send, Info, Trash2, Lock, Users, AlertCircle } from 'lucide-react'

import { saveCausale, confirmAndSend, clearCausaleRow, saveGiornata } from '@/app/actions/confirm'

// — Color Map: ogni codice ha la sua tavolozza coerente —
const CAUSALE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string; riepilogoBg: string; riepilogoText: string }> = {
  '*FE': { bg: 'bg-blue-100',    text: 'text-blue-900',   border: 'border-blue-200',   dot: 'bg-blue-500',    riepilogoBg: 'bg-blue-50',    riepilogoText: 'text-blue-600'    },
  '*FD': { bg: 'bg-blue-100',    text: 'text-blue-900',   border: 'border-blue-200',   dot: 'bg-blue-500',    riepilogoBg: 'bg-blue-50',    riepilogoText: 'text-blue-600'    },
  '*PE': { bg: 'bg-purple-100',  text: 'text-purple-900', border: 'border-purple-200', dot: 'bg-purple-500',  riepilogoBg: 'bg-purple-50',  riepilogoText: 'text-purple-600'  },
  '*PD': { bg: 'bg-purple-100',  text: 'text-purple-900', border: 'border-purple-200', dot: 'bg-purple-500',  riepilogoBg: 'bg-purple-50',  riepilogoText: 'text-purple-600'  },
  '*PA': { bg: 'bg-indigo-100',  text: 'text-indigo-900', border: 'border-indigo-200', dot: 'bg-indigo-500',  riepilogoBg: 'bg-indigo-50',  riepilogoText: 'text-indigo-600'  },
  '*RO': { bg: 'bg-teal-100',    text: 'text-teal-900',   border: 'border-teal-200',   dot: 'bg-teal-500',    riepilogoBg: 'bg-teal-50',    riepilogoText: 'text-teal-600'    },
  '*EF': { bg: 'bg-orange-100',  text: 'text-orange-900', border: 'border-orange-200', dot: 'bg-orange-500',  riepilogoBg: 'bg-orange-50',  riepilogoText: 'text-orange-600'  },
  '*ML': { bg: 'bg-red-100',     text: 'text-red-900',    border: 'border-red-200',    dot: 'bg-red-500',     riepilogoBg: 'bg-red-50',     riepilogoText: 'text-red-600'     },
  '*NP': { bg: 'bg-gray-100',    text: 'text-gray-700',   border: 'border-gray-200',   dot: 'bg-gray-400',    riepilogoBg: 'bg-gray-50',    riepilogoText: 'text-gray-500'    },
  '*DS': { bg: 'bg-green-100',   text: 'text-green-900',  border: 'border-green-200',  dot: 'bg-green-500',   riepilogoBg: 'bg-green-50',   riepilogoText: 'text-green-600'   },
  '*IN': { bg: 'bg-rose-100',    text: 'text-rose-900',   border: 'border-rose-200',   dot: 'bg-rose-500',    riepilogoBg: 'bg-rose-50',    riepilogoText: 'text-rose-600'    },
  '*MT': { bg: 'bg-pink-100',    text: 'text-pink-900',   border: 'border-pink-200',   dot: 'bg-pink-500',    riepilogoBg: 'bg-pink-50',    riepilogoText: 'text-pink-600'    },
  '*MO': { bg: 'bg-pink-100',    text: 'text-pink-900',   border: 'border-pink-200',   dot: 'bg-pink-500',    riepilogoBg: 'bg-pink-50',    riepilogoText: 'text-pink-600'    },
  '*AT': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-900',border: 'border-fuchsia-200',dot: 'bg-fuchsia-500', riepilogoBg: 'bg-fuchsia-50', riepilogoText: 'text-fuchsia-600' },
  'GEN': { bg: 'bg-slate-100',   text: 'text-slate-700',  border: 'border-slate-200',  dot: 'bg-slate-400',   riepilogoBg: 'bg-slate-50',   riepilogoText: 'text-slate-500'   },
  '*GG': { bg: 'bg-amber-200',   text: 'text-amber-950',  border: 'border-amber-300',  dot: 'bg-amber-600',   riepilogoBg: 'bg-amber-100',  riepilogoText: 'text-amber-700'   },
  '*GH': { bg: 'bg-amber-200',   text: 'text-amber-950',  border: 'border-amber-300',  dot: 'bg-amber-600',   riepilogoBg: 'bg-amber-100',  riepilogoText: 'text-amber-700'   },
  '*GJ': { bg: 'bg-amber-200',   text: 'text-amber-950',  border: 'border-amber-300',  dot: 'bg-amber-600',   riepilogoBg: 'bg-amber-100',  riepilogoText: 'text-amber-700'   },
  '*GK': { bg: 'bg-amber-200',   text: 'text-amber-950',  border: 'border-amber-300',  dot: 'bg-amber-600',   riepilogoBg: 'bg-amber-100',  riepilogoText: 'text-amber-700'   },
}

const DEFAULT_CAUSALE_STYLE = { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-200', dot: 'bg-amber-500', riepilogoBg: 'bg-amber-50', riepilogoText: 'text-amber-600' }
const EMPTY_CAUSALE_STYLE   = { bg: '', text: 'text-slate-300', border: '', dot: '', riepilogoBg: '', riepilogoText: '' }

function getCausaleStyle(codice: string | null) {
  if (!codice) return EMPTY_CAUSALE_STYLE
  return CAUSALE_COLORS[codice] || DEFAULT_CAUSALE_STYLE
}

// — CIG —
const CIG_CODES = ['*GG', '*GH', '*GJ', '*GK'] as const
const CIG_METEO = ['Pioggia', 'Neve', 'Caldo', 'Gelo', 'Vento'] as const

const CIG_OPZIONI = [
  { codice: '*GG', label: 'CIG Ord. atmos. ridotta — no anticipo' },
  { codice: '*GH', label: 'CIG Ord. atmos. ridotta — con anticipo' },
  { codice: '*GJ', label: 'CIG Ord. atmos. zero ore — no anticipo' },
  { codice: '*GK', label: 'CIG Ord. atmos. zero ore — con anticipo' },
]

// — Lista causali (dinamica: edile → FD/PD) —
function getElencoCausali(isEdile: boolean) {
  return [
    { codice: isEdile ? '*FD' : '*FE', label: isEdile ? 'Ferie Figurative' : 'Ferie' },
    { codice: isEdile ? '*PD' : '*PE', label: isEdile ? 'Permessi Figurativi' : 'Permessi' },
    { codice: '*RO', label: 'ROL' },
    { codice: '*EF', label: 'EXFestività' },
    { codice: '*ML', label: 'Malattia' },
    { codice: '*PA', label: 'Permessi aziendali' },
    { codice: '*NP', label: 'Assenza non retribuita' },
    { codice: '*DS', label: 'Donazione sangue' },
    { codice: '*IN', label: 'Infortunio' },
    { codice: '*MT', label: 'Maternità Obbligatoria' },
    { codice: '*MO', label: 'Maternità Facoltativa' },
    { codice: '*AT', label: 'Allattamento' },
    { codice: 'GEN', label: 'Generale' },
  ]
}


interface Causale {
  id?: string
  dipendente_id: string
  giorno: number
  numero: number
  codice: string | null
  ore: number | null
  note?: string | null
}

interface Giornata {
  giorno: number
  ore_lavorate: number | null
  ore_notturne: number | null
  ore_contrattuali: number | null
  turno: string | null
}

interface Dipendente {
  id: string
  foglio_id: string
  matricola: string
  cognome_nome: string
  giornate: Giornata[]
  causali: Causale[]
}

interface FoglioPresenzaProps {
  foglioId: string
  azienda: string
  sede: string | null
  anno: number
  mese: number
  status: string
  dipendenti: Dipendente[]
  readOnly?: boolean
  onBack?: () => void
}

const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// Calcolo festività nazionali italiane
function isFestivo(anno: number, mese: number, giorno: number) {
  const festiviFissi = [
    { m: 1, d: 1 },   // Capodanno
    { m: 1, d: 6 },   // Epifania
    { m: 4, d: 25 },  // Liberazione
    { m: 5, d: 1 },   // Lavoratori
    { m: 6, d: 2 },   // Repubblica
    { m: 8, d: 15 },  // Ferragosto
    { m: 10, d: 4 },  // San Francesco d'Assisi (richiesto)
    { m: 11, d: 1 },  // Ognissanti
    { m: 12, d: 8 },  // Immacolata
    { m: 12, d: 25 }, // Natale
    { m: 12, d: 26 }, // S. Stefano
  ]

  const isFisso = festiviFissi.some(f => f.m === mese && f.d === giorno)
  if (isFisso) return true

  // Calcolo Pasqua (Algoritmo di Meeus/Jones/Butcher)
  const a = anno % 19
  const b = Math.floor(anno / 100)
  const c = anno % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const pasquaMese = Math.floor((h + l - 7 * m + 114) / 31)
  const pasquaGiorno = ((h + l - 7 * m + 114) % 31) + 1

  // Pasquetta
  let pasquettaMese = pasquaMese
  let pasquettaGiorno = pasquaGiorno + 1
  if (pasquettaGiorno > getDaysInMonth(anno, pasquaMese)) {
    pasquettaGiorno = 1
    pasquettaMese++
  }

  if (mese === pasquaMese && giorno === pasquaGiorno) return true
  if (mese === pasquettaMese && giorno === pasquettaGiorno) return true

  return false
}

// Reusable calendar grid for multiple day selection
function DayPickerGrid({
  anno,
  mese,
  daysInMonth,
  minDate = 1,
  selectedDays,
  workedDays = [],
  onChange
}: {
  anno: number
  mese: number
  daysInMonth: number
  minDate?: number
  selectedDays: number[]
  workedDays?: number[]
  onChange: (days: number[]) => void
}) {
  const startDay = new Date(anno, mese - 1, 1).getDay()
  const offset = startDay === 0 ? 6 : startDay - 1
  
  const weekDays = ['LU', 'MA', 'ME', 'GI', 'VE', 'SA', 'DO']
  
  const toggleDay = (d: number) => {
    if (selectedDays.includes(d)) {
      if (selectedDays.length > 1) {
        onChange(selectedDays.filter(day => day !== d).sort((a, b) => a - b))
      }
    } else {
      onChange([...selectedDays, d].sort((a, b) => a - b))
    }
  }

  const selectAll = () => {
    const all = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(d => d >= minDate)
    onChange(all)
  }

  const selectWorked = () => {
    const valid = workedDays.filter(d => d >= minDate)
    if (valid.length > 0) onChange(valid)
  }

  return (
    <div className="w-full bg-slate-50 p-2 rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seleziona:</span>
        <div className="flex gap-1.5">
          <button 
            type="button" 
            onClick={selectAll}
            className="text-[10px] font-black text-[#D32F2F] hover:bg-red-50 px-2 py-1 rounded-lg border border-red-100 transition-colors"
          >
            TUTTI
          </button>
          {workedDays.length > 0 && (
            <button 
              type="button" 
              onClick={selectWorked}
              className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 transition-colors"
            >
              LAVORATI
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(wd => (
          <div key={wd} className="text-[9px] font-bold text-center text-slate-400 uppercase">{wd}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`empty-${i}`} className="h-8" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const isAvailable = d >= minDate
          const isSelected = selectedDays.includes(d)
          const isToday = d === new Date().getDate() && new Date().getMonth() + 1 === mese && new Date().getFullYear() === anno

          return (
            <button
              key={d}
              type="button"
              disabled={!isAvailable}
              onClick={() => toggleDay(d)}
              className={`
                h-8 w-full flex items-center justify-center text-[11px] font-bold rounded-lg transition-all
                ${isSelected 
                  ? 'bg-[#D32F2F] text-white shadow-md scale-105 z-10' 
                  : isAvailable 
                    ? 'bg-white text-slate-600 hover:bg-red-50 hover:text-[#D32F2F] border border-slate-100' 
                    : 'bg-slate-100/50 text-slate-300 cursor-not-allowed'}
                ${isToday && !isSelected ? 'ring-1 ring-red-200' : ''}
              `}
            >
              {d}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Inline editable giornata cell for ordinary and night hours
function GiornataCell({
  dipendente_id,
  giorno,
  campo, // 'ore_lavorate' | 'ore_notturne'
  valoreIniziale,
  valoreContrattuale, // Renamed from valoreTeorico
  displayValore, // Value to display when not editing
  daysInMonth,
  mese,
  anno,
  isActive,
  onToggle,
  isStraordinario = false,
  isOverLimit = false
}: {
  dipendente_id: string
  giorno: number
  campo: string
  valoreIniziale: number | null
  valoreContrattuale: number | null
  displayValore: number | null
  daysInMonth: number
  mese: number
  anno: number
  isActive: boolean
  onToggle: (open: boolean) => void
  isStraordinario?: boolean
  isOverLimit?: boolean
}) {
  const [valore, setValore] = useState(valoreIniziale !== null ? String(valoreIniziale) : '')
  const [selectedDays, setSelectedDays] = useState<number[]>([giorno])
  const [error, setError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [optimisticValore, setOptimisticValore] = useState<string | null>(null)

  // Sync state with server props
  useEffect(() => {
    if (!isActive) {
      setValore(valoreIniziale !== null ? String(valoreIniziale) : '')
      setError(null)
    }
  }, [valoreIniziale, isActive])

  function handleSave(overrideValue?: string) {
    const finalValore = typeof overrideValue === 'string' ? overrideValue : valore
    setError(null)
    
    // Se stiamo modificando le ore lavorate, impediamo la riduzione sotto le contrattuali
    if (campo === 'ore_lavorate' && valoreContrattuale !== null) {
      const v = parseFloat(finalValore) || 0
      if (v < valoreContrattuale) {
        setError("Per ridurre le ore lavorate usare le causali.")
        return
      }
    }

    // Se stiamo modificando le ore notturne, impediamo il superamento delle lavorate
    if (campo === 'ore_notturne' && valoreContrattuale !== null) {
      const v = parseFloat(finalValore) || 0
      if (v > valoreContrattuale) {
        setError("Le ore notturne non possono essere maggiori delle ore lavorate.")
        return
      }
    }

    const fd = new FormData()
    fd.set('dipendente_id', dipendente_id)
    fd.set('giorno', String(giorno))
    fd.set('selectedDays', JSON.stringify(selectedDays))
    fd.set('campo', campo)
    fd.set('valore', finalValore)

    setOptimisticValore(finalValore)
    onToggle(false)

    startSave(async () => {
      try {
        await saveGiornata(fd)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  const label = campo === 'ore_lavorate' ? 'Ore Lavorate' : 'Di cui notturne'
  const isOptimistic = optimisticValore !== null && saving
  const currentValore = isOptimistic ? optimisticValore : (displayValore ?? '')

  return (
    <div className="relative h-full w-full group">
      <div
        onClick={() => onToggle(!isActive)}
        className={`flex h-full w-full min-h-[44px] cursor-pointer items-center justify-center transition-all hover:bg-slate-100/80 
          ${isOverLimit ? 'bg-red-100 text-red-800' : isStraordinario ? 'bg-amber-100 text-amber-800' : ''}
          ${isOptimistic ? 'animate-pulse text-indigo-400 font-bold bg-indigo-50/20' : ''}
          ${!isOverLimit && !isStraordinario && !isOptimistic ? 'text-slate-900' : ''}
        `}
      >
        {currentValore}
      </div>

      {isActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
              Modifica {label}
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                Giorno {giorno}
              </span>
            </h3>

            <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Ore</label>
                    <input
                      type="number"
                      value={valore}
                      onChange={e => setValore(e.target.value)}
                      placeholder="Inserisci ore"
                      min={0}
                      step={0.5}
                      className={`w-full text-sm rounded-xl border px-3 py-2 outline-none transition-all ${
                        parseFloat(valore) > 12 
                          ? 'border-red-500 bg-red-50 focus:ring-red-200' 
                          : 'border-slate-200 bg-slate-50 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F]'
                      }`}
                    />
                    {parseFloat(valore) > 12 && (
                      <p className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Superati i limiti di lavoro giornalieri
                      </p>
                    )}
                  </div>

              <div className="pt-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block text-center">Applica ai giorni selezionati</label>
                <DayPickerGrid
                  anno={anno}
                  mese={mese}
                  daysInMonth={daysInMonth}
                  minDate={1}
                  selectedDays={selectedDays}
                  onChange={setSelectedDays}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onToggle(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                {campo === 'ore_notturne' && (
                  <button
                    type="button"
                    onClick={() => {
                      setValore('')
                      handleSave('')
                    }}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    Cancella
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex-[2] rounded-xl bg-[#D32F2F] px-4 py-2.5 text-[11px] font-bold text-white hover:bg-[#b02727] disabled:opacity-50 shadow-lg shadow-red-900/10 transition-all"
                >
                  {saving ? 'Salvataggio...' : 'Conferma'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

function getCantiereColor(cod: string | null) {
  if (!cod || cod === '1') return { bg: '', text: 'text-slate-600', border: '' }
  
  const colors = [
    { bg: 'bg-indigo-50/50', text: 'text-indigo-700', border: 'border-indigo-100' },
    { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-100' },
    { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-100' },
    { bg: 'bg-purple-50/50', text: 'text-purple-700', border: 'border-purple-100' },
    { bg: 'bg-rose-50/50', text: 'text-rose-700', border: 'border-rose-100' },
    { bg: 'bg-cyan-50/50', text: 'text-cyan-700', border: 'border-cyan-100' },
    { bg: 'bg-orange-50/50', text: 'text-orange-700', border: 'border-orange-100' },
  ]
  
  // Simple hash for consistency
  let hash = 0
  for (let i = 0; i < cod.length; i++) {
    hash = cod.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

function SedeCell({
  dipendente_id,
  giorno,
  valoreIniziale,
  isActive,
  onToggle,
  cantieri,
  additionalSedi,
  profile,
  daysInMonth,
  mese,
  anno,
  workedDays,
}: {
  dipendente_id: string
  giorno: number
  valoreIniziale: string | null
  isActive: boolean
  onToggle: (active: boolean) => void
  cantieri: any[]
  additionalSedi: any[]
  profile: any
  daysInMonth: number
  mese: number
  anno: number
  workedDays: number[]
}) {
  const [valore, setValore] = useState(valoreIniziale || '')
  const [selectedDays, setSelectedDays] = useState<number[]>([giorno])
  const [error, setError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [optimisticValore, setOptimisticValore] = useState<string | null>(null)

  useEffect(() => {
    if (!isActive) {
      setValore(valoreIniziale || '')
      setSelectedDays([giorno])
      setError(null)
    }
  }, [valoreIniziale, isActive, giorno])

  // Automatically fill logic moved to DipendenteSection
  function handleSave() {
    if (!valore) {
      setError("Selezionare un valore")
      return
    }

    const fd = new FormData()
    fd.set('dipendente_id', dipendente_id)
    fd.set('giorno', String(giorno))
    fd.set('selectedDays', JSON.stringify(selectedDays))
    fd.set('campo', 'turno')
    fd.set('valore', valore)

    setOptimisticValore(valore)
    onToggle(false)

    startSave(async () => {
      try {
        await saveGiornata(fd)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  // Filter valid cantieri (DD/MM/YYYY)
  const validCantieri = (cantieri || []).filter(c => {
    if (!c.a) return true
    try {
      const parts = c.a.split('/')
      if (parts.length !== 3) return true
      // Parse DD/MM/YYYY
      const expiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
      // Set to end of day
      expiry.setHours(23, 59, 59, 999)
      return expiry >= new Date()
    } catch {
      return true
    }
  })

  // Options for dropdown
  const options = (cantieri || []).length > 0 
    ? validCantieri.map(c => {
        const identifier = c.causal || c.cod
        const labelParts = []
        if (identifier) labelParts.push(`[${identifier}]`)
        if (c.cantiere) labelParts.push(c.cantiere)
        if (c.civico) labelParts.push(c.civico)
        if (c.comune) labelParts.push(c.comune)
        if (c.prov) labelParts.push(c.prov)
        if (c.committente) labelParts.push(c.committente)

        return { 
          value: identifier || c.cantiere, 
          label: labelParts.join(' ').toUpperCase()
        }
      })
    : [
        { value: profile?.numero_sede || '1', label: `Sede ${profile?.numero_sede || '1'}` },
        ...(additionalSedi || []).map(s => ({ value: s.numero, label: `Sede ${s.numero}` }))
      ]

  const isOptimistic = optimisticValore !== null && saving
  const currentValore = isOptimistic ? optimisticValore : (valoreIniziale || '')
  const cStyle = getCantiereColor(currentValore)

  return (
    <div className="relative h-full w-full group">
      <div
        onClick={() => onToggle(!isActive)}
        className={`flex h-full w-full min-h-[44px] cursor-pointer items-center justify-center transition-colors hover:bg-slate-100/80 ${cStyle.bg} ${isOptimistic ? 'animate-pulse opacity-70' : ''}`}
      >
        <span className={`px-0.5 leading-tight font-black ${currentValore && currentValore.length > 2 ? 'text-[9px]' : 'text-[11px]'} ${cStyle.text}`}>
          {currentValore}
        </span>
      </div>

      {isActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3 flex justify-between items-center">
              Seleziona {cantieri.length > 0 ? 'Cantiere' : 'Sede'}
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                Giorno {giorno}
              </span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                  {cantieri.length > 0 ? 'Lista Cantieri' : 'Lista Sedi'}
                </label>
                <select
                  value={valore}
                  onChange={e => setValore(e.target.value)}
                  className="w-full text-sm font-bold rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                >
                  <option value="">Seleziona...</option>
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block text-center">Applica ai giorni selezionati</label>
                <DayPickerGrid
                  anno={anno}
                  mese={mese}
                  daysInMonth={daysInMonth}
                  minDate={1}
                  selectedDays={selectedDays}
                  workedDays={workedDays}
                  onChange={setSelectedDays}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-6">
              <button
                onClick={() => onToggle(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#D32F2F] px-4 py-3 text-sm font-bold text-white hover:bg-[#b02727] disabled:opacity-50 shadow-lg shadow-red-900/10 transition-all"
              >
                {saving ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Inline editable causale cell
function CausaleCell({
  dipendente_id,
  giorno,
  numero,
  initial,
  oreLavorate,
  isActive,
  onToggle,
  otherCausaliSum,
  daysInMonth,
  mese,
  anno,
  isEdile,
  workedDays,
  overtimeDays,
}: {
  dipendente_id: string
  giorno: number
  numero: number
  initial: { codice: string | null; ore: number | null; note?: string | null }
  oreLavorate: number | null
  isActive: boolean
  onToggle: (open: boolean) => void
  otherCausaliSum: number
  daysInMonth: number
  mese: number
  anno: number
  isEdile: boolean
  workedDays: number[]
  overtimeDays: number[]
}) {
  const [codice, setCodice] = useState(initial.codice || '')
  const [ore, setOre] = useState(initial.ore !== null ? String(initial.ore) : '')
  const [note, setNote] = useState(initial.note || '')
  const [selectedDays, setSelectedDays] = useState<number[]>([giorno])
  const [useMax, setUseMax] = useState(false)
  const [saving, startSave] = useTransition()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasChanged, setHasChanged] = useState(false)
  const [optimisticCodice, setOptimisticCodice] = useState<string | null>(null)
  const [optimisticOre, setOptimisticOre] = useState<string | null>(null)
  // CIG two-step state
  const [cigStep, setCigStep] = useState<1 | 2>(1)
  const [cigCodice, setCigCodice] = useState('')
  const [cigMeteo, setCigMeteo] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isClearedDisplay, setIsClearedDisplay] = useState(false)
  const isClearingRef = useRef(false)

  // Detect if currently displaying a CIG code
  const isCigCode = (c: string) => (CIG_CODES as readonly string[]).includes(c)

  // Once the server confirms the cell is empty, stop hiding it
  useEffect(() => {
    if (isClearedDisplay && !initial.codice) {
      setIsClearedDisplay(false)
    }
  }, [initial.codice, isClearedDisplay])

  useEffect(() => {
    if (codice !== (initial.codice || '') || ore !== (initial.ore !== null ? String(initial.ore) : '')) {
      setHasChanged(true)
    }
  }, [codice, ore, initial])

  useEffect(() => {
    if (!isActive) {
      // Skip reset if we are in the middle of a clear operation
      if (isClearingRef.current) {
        isClearingRef.current = false
        return
      }
      setCodice(initial.codice || '')
      setOre(initial.ore !== null ? String(initial.ore) : '')
      setNote(initial.note || '')
      setCigStep(1)
      setCigCodice('')
      setCigMeteo('')
      setShowDeleteConfirm(false)
      setUseMax(false)
    }
  }, [initial.codice, initial.ore, initial.note, isActive])

  useEffect(() => {
    if (isActive && !ore && oreLavorate !== null) {
      const remaining = Math.max(0, oreLavorate - otherCausaliSum)
      if (remaining > 0) setOre(String(remaining))
    }
  }, [isActive, ore, oreLavorate, otherCausaliSum])

  // Auto-save when closing
  useEffect(() => {
    if (!isActive && hasChanged) {
      if (codice) {
        const oreNum = ore ? parseFloat(ore) : 0
        if (oreNum + otherCausaliSum <= (oreLavorate || 0)) {
          const fd = new FormData()
          fd.set('dipendente_id', dipendente_id)
          fd.set('giorno', String(giorno))
          fd.set('numero', String(numero))
          fd.set('codice', codice)
          fd.set('ore', useMax ? 'MAX' : ore)
          fd.set('note', note)
          fd.set('selectedDays', JSON.stringify(selectedDays))
          saveCausale(fd)
        }
      }
      setHasChanged(false)
    }
  }, [isActive, hasChanged, codice, ore, note, selectedDays, dipendente_id, giorno, numero, otherCausaliSum, oreLavorate])

  function handleSave() {
    setValidationError(null)
    const oreNum = ore ? parseFloat(ore) : 0
    const totalDayHours = (oreLavorate || 0)

    if (oreNum + otherCausaliSum > totalDayHours) {
      setValidationError(`Totale giornaliero superato (${oreNum + otherCausaliSum}h > ${totalDayHours}h)`)
      return
    }

    let finalCodice = codice
    let finalOre = ore
    let finalNote = note

    if (!codice) {
      finalCodice = ''
      finalOre = ''
      finalNote = ''
    } else {
      if (oreNum <= 0) {
        setValidationError('Inserire le ore')
        return
      }
    }

    const fd = new FormData()
    fd.set('dipendente_id', dipendente_id)
    fd.set('giorno', String(giorno))
    fd.set('numero', String(numero))
    fd.set('codice', finalCodice)
    fd.set('ore', useMax ? 'MAX' : finalOre)
    fd.set('note', finalNote)
    fd.set('selectedDays', JSON.stringify(selectedDays))

    setOptimisticCodice(finalCodice)
    setOptimisticOre(finalOre)
    onToggle(false)

    startSave(async () => {
      try { await saveCausale(fd) } catch {}
    })
  }

  function handleClear() {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    
    // Set the flag BEFORE calling onToggle to prevent the reset useEffect from overwriting our clear
    isClearingRef.current = true
    setIsClearedDisplay(true)  // Keep cell visually empty until server confirms

    // Reset local state to clear the UI immediately
    setCodice('')
    setOre('')
    setNote('')
    setHasChanged(false)
    setShowDeleteConfirm(false)

    // Also clear optimistic state
    setOptimisticCodice('')
    setOptimisticOre('')
    
    // Close modal
    onToggle(false)

    // Delete on server
    const fd = new FormData()
    fd.set('dipendente_id', dipendente_id)
    fd.set('giorno', String(giorno))
    fd.set('numero', String(numero))
    fd.set('codice', '')
    fd.set('ore', '')
    fd.set('note', '')
    fd.set('selectedDays', JSON.stringify(selectedDays))

    startSave(async () => {
      try { 
        await saveCausale(fd) 
      } catch (e) {
        console.error("Clear error:", e)
      }
    })
  }

  function handleCigConfirm() {
    if (!cigCodice) { setValidationError('Seleziona il tipo di CIG'); return }
    if (!cigMeteo) { setValidationError('Seleziona la causale meteo (obbligatoria)'); return }
    setValidationError(null)
    setCodice(cigCodice)
    setNote(cigMeteo)
    setCigStep(1) // back to step 1 but with CIG code filled
  }

  const isOptimistic = (optimisticCodice !== null || optimisticOre !== null) && saving
  const currentCodice = isClearedDisplay ? '' : (isOptimistic ? optimisticCodice : (initial.codice || ''))
  const currentOre = isClearedDisplay ? '' : (isOptimistic ? optimisticOre : (initial.ore ? String(initial.ore) : ''))
  const cellStyle = getCausaleStyle(currentCodice)
  const elencoCausali = getElencoCausali(isEdile)

  return (
    <td className="border border-slate-100 p-0 relative min-w-[32px]">
      <button
        onClick={() => onToggle(!isActive)}
        className={`w-full h-full min-h-[44px] flex flex-col items-center justify-center transition-colors relative font-bold ${
          currentCodice
            ? `${cellStyle.bg} ${cellStyle.text}`
            : 'hover:bg-slate-50 text-slate-300'
        } ${isOptimistic ? 'animate-pulse opacity-70' : ''}`}
        title={initial.note ? `Meteo/Nota: ${initial.note}` : undefined}
      >
        {currentCodice || '—'}
        {currentOre ? <span className={`block text-[9px] opacity-70`}>{currentOre}h</span> : null}
        {/* Rimosso indicatore dot per nota/meteo per pulizia UI */}
      </button>

      {isActive && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {cigStep === 2 ? '🏗️ Dettaglio CIG' : 'Modifica Causale'}
              </h3>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">
                Giorno {giorno} — Caus. {numero}
              </span>
            </div>

            {/* Step 1: normale */}
            {cigStep === 1 && (
              <>
                {oreLavorate !== null && (
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                    Ore ordinarie disponibili: <strong>{oreLavorate}h</strong><br/>
                    <span className="text-[10px] opacity-80">Rimanenti dopo altre causali: {Math.max(0, oreLavorate - otherCausaliSum)}h</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tipo Causale</label>
                    <select
                      value={isCigCode(codice) ? '__CIG__' : codice}
                      onChange={e => {
                        const val = e.target.value
                        if (val === '__CIG__') {
                          setCigStep(2)
                          setCigCodice('')
                          setCigMeteo('')
                        } else {
                          setCodice(val)
                          if (!val) { setOre(''); setNote('') }
                        }
                      }}
                      className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                    >
                      <option value="">— Nessuna —</option>
                      {elencoCausali.map(g => (
                        <option key={g.codice} value={g.codice}>{g.codice} — {g.label}</option>
                      ))}
                      {isEdile && (
                        <option value="__CIG__">CIG — Cassa Integrazione</option>
                      )}
                    </select>
                    {isCigCode(codice) && (
                      <p className="mt-1 text-[10px] text-amber-700 font-semibold">
                        CIG selezionata: <strong>{codice}</strong>
                        {note && <> — Meteo: <strong>{note}</strong></>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block tracking-wider">Ore</label>
                    <div className="flex gap-3 items-center">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          disabled={useMax}
                          value={useMax ? '' : ore}
                          onChange={e => {
                            setOre(e.target.value)
                            setHasChanged(true)
                          }}
                          className={`w-full text-sm font-black rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all ${useMax ? 'opacity-50 grayscale bg-slate-100 cursor-not-allowed' : ''}`}
                          placeholder={useMax ? 'MAX' : "0.0"}
                        />
                        {useMax && (
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            <span className="text-[10px] font-black text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded uppercase">Auto</span>
                          </div>
                        )}
                      </div>
                      
                      <label className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all cursor-pointer select-none ${useMax ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                        <input 
                          type="checkbox" 
                          checked={useMax} 
                          onChange={(e) => {
                            setUseMax(e.target.checked)
                            setHasChanged(true)
                          }}
                          className="w-4 h-4 text-[#D32F2F] rounded border-slate-300 focus:ring-[#D32F2F]"
                        />
                        <span className={`text-[10px] font-black uppercase ${useMax ? 'text-[#D32F2F]' : 'text-slate-500'}`}>MAX</span>
                      </label>
                    </div>
                    {useMax && (
                      <p className="mt-1.5 text-[10px] text-slate-500 font-medium italic">
                        Verranno applicate le ore massime disponibili per ogni giorno selezionato.
                      </p>
                    )}
                  </div>

                  {/* Range */}
                  <div className="pt-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block text-center">Applica ai giorni selezionati</label>
                    <DayPickerGrid
                      anno={anno}
                      mese={mese}
                      daysInMonth={daysInMonth}
                      minDate={1}
                      selectedDays={selectedDays}
                      workedDays={workedDays}
                      onChange={setSelectedDays}
                    />
                  </div>

                  {/* Note for GEN */}
                  {codice === 'GEN' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Note / Motivo</label>
                      <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Specificare il motivo..."
                        className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] min-h-[60px] resize-none transition-all"
                      />
                    </div>
                  )}
                </div>

                {validationError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-medium">{validationError}</p>
                )}

                <div className="flex items-center justify-between pt-2">
                  {/* Tasto Cancella (Sinistra) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleClear()
                    }}
                    onMouseLeave={() => setShowDeleteConfirm(false)}
                    title={showDeleteConfirm ? "Conferma cancellazione" : "Rimuovi questa causale"}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all border ${
                      showDeleteConfirm 
                        ? 'bg-red-600 text-white border-red-700 shadow-inner' 
                        : 'text-red-500 border-red-100 hover:text-red-700 hover:bg-red-50'
                    }`}
                  >
                    {showDeleteConfirm ? (
                      <>Sei sicuro?</>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancella
                      </>
                    )}
                  </button>

                    {/* Avviso Straordinari */}
                    {selectedDays.some(d => overtimeDays.includes(d)) && (
                      <div className="mb-4 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-pulse">
                        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                        <p className="text-[10px] text-red-700 font-bold leading-tight">
                          Attenzione: si sta inserendo una causale in una giornata con straordinari segnati.
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { onToggle(false); setValidationError(null) }}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-xl bg-[#D32F2F] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#b02727] disabled:opacity-50 shadow-lg shadow-red-900/10 transition-all"
                      >
                        {saving ? 'Salvataggio...' : 'Conferma'}
                      </button>
                    </div>
                  </div>
              </>
            )}

            {/* Step 2: CIG sub-selection */}
            {cigStep === 2 && (
              <>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
                  🏗️ Seleziona il tipo di CIG e la causale meteo. Entrambi i campi sono obbligatori.
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tipo CIG</label>
                    <select
                      value={cigCodice}
                      onChange={e => { setCigCodice(e.target.value); setValidationError(null) }}
                      className={`w-full text-sm rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all ${!cigCodice && validationError ? 'border-red-400' : 'border-slate-200'}`}
                    >
                      <option value="">— Seleziona —</option>
                      {CIG_OPZIONI.map(o => (
                        <option key={o.codice} value={o.codice}>{o.codice} — {o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                      Causale Meteo <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {CIG_METEO.map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setCigMeteo(m); setValidationError(null) }}
                          className={`py-2 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                            cigMeteo === m
                              ? 'bg-amber-500 border-amber-600 text-white shadow-md'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-amber-300 hover:bg-amber-50'
                          }`}
                        >
                          {m === 'Pioggia' ? '🌧️' : m === 'Neve' ? '❄️' : m === 'Caldo' ? '☀️' : m === 'Gelo' ? '🧊' : '💨'}<br/>{m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {validationError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 font-medium">{validationError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setCigStep(1); setValidationError(null) }}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    ← Indietro
                  </button>
                  <button
                    onClick={handleCigConfirm}
                    className="flex-1 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 shadow-md transition-all"
                  >
                    Seleziona CIG
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </td>
  )
}




interface FoglioPresenzaProps {
  foglioId: string
  azienda: string
  sede: string | null
  anno: number
  mese: number
  status: string
  dipendenti: Dipendente[]
  cantieri: any[]
  additionalSedi: any[]
  profile: any
  cigFasi: { cantiere_cod: string; fase_lavorativa: string }[]
  readOnly?: boolean
  onBack?: () => void
}

function DipendenteSectionDesktop({ 
  dip, daysInMonth, foglioStatus, activeCell, onToggleCell, cantieri, additionalSedi, profile, isEdile, anno, mese 
}: { 
  dip: Dipendente, 
  daysInMonth: number, 
  foglioStatus: string,
  activeCell: string | null,
  onToggleCell: (id: string | null) => void,
  cantieri: any[],
  additionalSedi: any[],
  profile: any,
  isEdile: boolean,
  anno: number,
  mese: number
}) {
  const [expanded, setExpanded] = useState(true)
  const [clearingRows, setClearingRows] = useState<number[]>([])
  const [confirmingRow, setConfirmingRow] = useState<number | null>(null)
  const [causali, setCausali] = useState(dip.causali)
  const isConfermato = foglioStatus === 'confermato' || foglioStatus === 'chiuso'

  // Auto-fill SEDE logic
  useEffect(() => {
    if (isConfermato) return
    const allEmpty = dip.giornate.every(g => !g.turno)
    if (!allEmpty) return

    let defaultValue: string | null = null

    // 1. Check for active cantieri (pick the most recent one)
    const validCantieri = (cantieri || []).filter(c => {
      if (!c.a) return true
      try {
        const parts = c.a.split('/')
        if (parts.length !== 3) return true
        const expiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]))
        expiry.setHours(23, 59, 59, 999)
        return expiry >= new Date()
      } catch { return true }
    })

    if (validCantieri.length > 0) {
      defaultValue = validCantieri[0].cod || validCantieri[0].cantiere
    } else {
      // 2. Fallback to HQ if only one sede
      const hasAdditionalSedi = additionalSedi && additionalSedi.length > 0
      const onlyOneSede = !hasAdditionalSedi && (profile?.numero_sede === '1' || !profile?.numero_sede)
      if (onlyOneSede) {
        defaultValue = profile?.numero_sede || '1'
      }
    }

    if (defaultValue) {
      const fd = new FormData()
      fd.set('dipendente_id', dip.id)
      fd.set('giorno', '1')
      fd.set('alGiorno', String(daysInMonth))
      fd.set('campo', 'turno')
      fd.set('valore', defaultValue)
      saveGiornata(fd)
    }
  }, [cantieri, additionalSedi, profile, dip.id, daysInMonth, isConfermato, dip.giornate])

  // Sync causali when dip prop changes (e.g. after server revalidation)
  useEffect(() => {
    setCausali(dip.causali)
  }, [dip.causali])

  const rowHasData = (rowNum: number) => {
    return (causali || []).some(c => c.numero === rowNum && (c.codice || c.ore))
  }

  async function handleClearRow(numero: number) {
    setConfirmingRow(null)
    setClearingRows(prev => [...prev, numero])
    // Optimistic update: remove from local state immediately
    setCausali(prev => prev.filter(c => c.numero !== numero))

    try {
      await clearCausaleRow(dip.id, numero)
    } catch (e) {
      console.error('clearCausaleRow failed:', e)
      // Roll back optimistic update
      setCausali(dip.causali)
      setConfirmingRow(null)
    } finally {
      setClearingRows(prev => prev.filter(n => n !== numero))
    }
  }

  const getGiornata = (g: number) => dip.giornate.find(x => x.giorno === g)
  const getCausale = (g: number, n: number) => causali.find(c => c.giorno === g && c.numero === n)

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Calculate Summary Totals
  const summary = {
    ordinarie: 0,
    straordinario: 0,
    giorniLavorati: 0,
    codici: {} as Record<string, number>
  }

  days.forEach(d => {
    const giornata = getGiornata(d)
    const oreLavorateEffettive = giornata?.ore_lavorate ?? 0
    const oreContrattuali = giornata?.ore_contrattuali ?? 0
    
    // Lo straordinario è la differenza tra lavorate e teoriche (solo se positiva)
    if (oreLavorateEffettive > oreContrattuali) {
      summary.straordinario += (oreLavorateEffettive - oreContrattuali)
    }

    let oreGiustificateGiorno = 0
    for(let n=1; n<=5; n++) {
      const c = getCausale(d, n)
      if (c?.ore && c.codice) {
        summary.codici[c.codice] = (summary.codici[c.codice] || 0) + c.ore
        oreGiustificateGiorno += c.ore
      }
    }
    
    
    // Le ordinarie pagate sono le lavorate effettive meno le causali (ferie, permessi ecc)
    // MA non devono superare le teoriche (perché l'eccedenza è già nello straordinario)
    const basePerOrdinarie = Math.min(oreLavorateEffettive, oreContrattuali)
    const effectiveOrd = Math.max(0, basePerOrdinarie - oreGiustificateGiorno)
    
    summary.ordinarie += effectiveOrd
    if (effectiveOrd > 0) summary.giorniLavorati++
  })

  // Helper for summary grid — FD = FE (ferie figurative), PD = PE (permessi figurativi)
  const getSum = (codes: string[]) => codes.reduce((acc, code) => acc + (summary.codici[code] || 0), 0)
  
  const totals = {
    ferie: getSum(['*FE', '*FD']),
    permessi: getSum(['*PE', '*PD', '*PA']),
    rol: getSum(['*RO']),
    festivita: getSum(['*EF']),
    malattia: getSum(['*ML']),
    infortunio: getSum(['*IN']),
    maternita: getSum(['*MT', '*MO']),
    allattamento: getSum(['*AT']),
    donazione: getSum(['*DS']),
    altro: getSum(['GEN']),
    nonPagate: getSum(['*NP']),
    cig: getSum(['*GG', '*GH', '*GJ', '*GK']),
  }
  const totaleOre = summary.ordinarie + totals.ferie + totals.permessi + totals.rol + totals.festivita + totals.malattia + totals.infortunio + totals.maternita + totals.allattamento + totals.donazione + totals.altro
  const giorniRetribuiti = summary.giorniLavorati + (totals.ferie > 0 ? 1 : 0) // Simplified GG Retr logic

  return (
    <div className="mb-4 border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-500">Mat. {dip.matricola}</span>
          <span className="font-semibold text-slate-900">{dip.cognome_nome}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr className="bg-slate-700 text-white">
                <th className="sticky left-0 z-10 bg-slate-700 px-2 py-2 text-left min-w-[100px]">Tipo</th>
                {days.map(d => {
                  const date = new Date(anno, mese - 1, d)
                  const isDomenica = date.getDay() === 0
                  const isF = isFestivo(anno, mese, d)
                  const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().substring(0, 2)
                  
                  // Colore testo: Rosso se domenica, Giallo (Stitch Yellow-400) se festivo feriale, Bianco altrimenti
                  let textColor = 'text-white'
                  if (isDomenica) textColor = 'text-red-400'
                  else if (isF) textColor = 'text-yellow-400'

                  return (
                    <th key={d} className={`px-0.5 py-1 text-center min-w-[35px] border-l border-slate-600 leading-tight relative ${textColor}`}>
                      <div className="text-[10px] font-bold">{d}</div>
                      <div className="text-[9px] opacity-80 font-medium">{dayName}</div>
                      {/* Se è festivo di domenica, aggiungiamo un indicatore (puntino giallo sotto) */}
                      {isDomenica && isF && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_4px_rgba(250,204,21,0.8)]" />
                      )}
                    </th>
                  )
                })}
                <th className="bg-slate-800 px-2 py-2 text-center min-w-[45px] font-bold border-l border-slate-600 text-[11px]">TOT</th>
                {/* 4x4 Summary Grid Headers */}
                <th colSpan={4} className="bg-slate-800 px-2 py-3 text-sm font-bold text-center border-l border-slate-600">Riepilogo Mensile</th>
              </tr>
            </thead>
            <tbody>
              {/* Contrattuali — read only */}
              <tr className="bg-slate-50/50 border-b border-slate-100 h-8">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-0.5 text-[11px] font-medium text-slate-400 border-r border-slate-200">
                  Contrattuali
                </td>
                {days.map(d => (
                  <td key={d} className="border border-slate-100 px-0.5 py-1 text-center text-slate-400 font-medium">
                    {getGiornata(d)?.ore_contrattuali || ''}
                  </td>
                ))}
                <td className="bg-slate-100 border border-slate-200 px-1 py-1 text-center font-bold text-slate-500 min-w-[45px]">
                  {days.reduce((acc, d) => acc + (getGiornata(d)?.ore_contrattuali || 0), 0)}
                </td>
                <td className="bg-slate-50 border-l-2 border-l-slate-400" colSpan={4}></td>
              </tr>

              {/* Ore lavorate — editable */}
              <tr className="bg-white border-b border-slate-200 group/row h-11">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1 font-medium text-slate-700 border-r border-slate-200">
                  <div className="flex justify-between items-center">
                    <span>Ore lavorate</span>
                  </div>
                </td>
                {days.map(d => {
                  const giornata = getGiornata(d)
                  const origOre = giornata?.ore_lavorate ?? null
                  const cellId = `giornata-lavorate-${dip.id}-${d}`
                  // Sum all causali ore for this day
                  const totCausali = [1,2,3,4,5].reduce((acc, n) => {
                    const c = getCausale(d, n)
                    return acc + (c?.ore ?? 0)
                  }, 0)
                  const effectiveOre = origOre !== null ? Math.max(0, origOre - totCausali) : null
                  const lavorateNum = Number(giornata?.ore_lavorate || 0)
                  const contrattualiNum = Number(giornata?.ore_contrattuali || 0)
                  const isStraordinario = lavorateNum > contrattualiNum
                  const isOverLimit = lavorateNum > 12
                  
                  let cellBg = ''
                  if (isOverLimit) cellBg = 'bg-red-100'
                  else if (isStraordinario) cellBg = 'bg-amber-100'

                  return (
                    <td key={d} className={`relative border border-slate-100 p-0 text-center font-bold text-sm min-w-[35px] ${cellBg}`}>
                      {isConfermato ? (
                         <div className={`flex h-11 w-full items-center justify-center p-1.5 ${isOverLimit ? 'text-red-800' : isStraordinario ? 'text-amber-800' : 'text-slate-900'}`}>
                           {effectiveOre !== null ? effectiveOre : ''}
                         </div>
                      ) : (
                         <GiornataCell
                           dipendente_id={dip.id}
                           giorno={d}
                           campo="ore_lavorate"
                           valoreIniziale={origOre}
                           valoreContrattuale={giornata?.ore_contrattuali ?? 0}
                           displayValore={effectiveOre}
                           daysInMonth={daysInMonth}
                           mese={mese}
                           anno={anno}
                           isActive={activeCell === cellId}
                           onToggle={(open) => onToggleCell(open ? cellId : null)}
                         />
                      )}
                    </td>
                  )
                })}
                <td className="bg-blue-100/50 border border-blue-200 px-1 py-2 text-center font-black text-blue-900 min-w-[45px] text-sm">
                  {days.reduce((acc, d) => {
                    const g = getGiornata(d)
                    const o = g?.ore_lavorate ?? null
                    const totC = [1,2,3,4,5].reduce((a, n) => a + (getCausale(d, n)?.ore ?? 0), 0)
                    return acc + (o !== null ? Math.max(0, o - totC) : 0)
                  }, 0)}
                </td>
                {/* Summary Row 1 */}
                <td className="bg-blue-50 border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">HH Lav</span>
                  {summary.ordinarie}
                </td>
                <td className="bg-blue-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">GG Lav</span>
                  {summary.giorniLavorati}
                </td>
                <td className={`${summary.straordinario > 0 ? 'bg-amber-100' : 'bg-amber-50'} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm`}>
                  <span className={`block text-[8px] ${summary.straordinario > 0 ? 'text-amber-700' : 'text-amber-600'} font-normal uppercase tracking-wider`}>Straor.</span>
                  {summary.straordinario}
                </td>
                <td className="bg-blue-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">Ferie</span>
                  {totals.ferie}
                </td>
              </tr>

                {/* Ore notturne — editable */}
              <tr className="bg-white group/row h-11">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1 text-slate-500 border-r border-slate-200">
                  di cui notturne
                </td>
                {days.map(d => {
                  const giornata = getGiornata(d)
                  const cellId = `giornata-notturne-${dip.id}-${d}`
                  return (
                    <td key={d} className="relative border border-slate-100 p-0 text-center text-slate-900 font-bold text-sm min-w-[35px]">
                      {isConfermato ? (
                        <div className="flex h-full w-full items-center justify-center p-1.5">
                          {giornata?.ore_notturne ?? ''}
                        </div>
                      ) : (
                        <GiornataCell
                          dipendente_id={dip.id}
                          giorno={d}
                          campo="ore_notturne"
                          valoreIniziale={giornata?.ore_notturne ?? null}
                          valoreContrattuale={giornata?.ore_lavorate ?? 0}
                          displayValore={giornata?.ore_notturne ?? null}
                          daysInMonth={daysInMonth}
                          mese={mese}
                          anno={anno}
                          isActive={activeCell === cellId}
                          onToggle={(open) => onToggleCell(open ? cellId : null)}
                        />
                      )}
                    </td>
                  )
                })}
                <td className="bg-slate-100 border border-slate-200 px-1 py-1 text-center font-bold text-slate-500 min-w-[45px]">
                  {days.reduce((acc, d) => acc + (getGiornata(d)?.ore_notturne || 0), 0)}
                </td>
                {/* Summary Row 2 */}
                <td className="bg-emerald-50 border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                  <span className="block text-[8px] text-emerald-600 font-normal uppercase tracking-wider">HH Retr</span>
                  {totaleOre}
                </td>
                <td className="bg-emerald-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                  <span className="block text-[8px] text-emerald-600 font-normal uppercase tracking-wider">GG Retr</span>
                  {giorniRetribuiti}
                </td>
                <td className="bg-emerald-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                  <span className="block text-[8px] text-emerald-600 font-normal uppercase tracking-wider">Festiv.</span>
                  {totals.festivita}
                </td>
                <td className="bg-emerald-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                  <span className="block text-[8px] text-emerald-600 font-normal uppercase tracking-wider">ROL</span>
                  {totals.rol}
                </td>
              </tr>

              {/* Causali 1-5 — editable with Progressive Disclosure */}
              {[1, 2, 3, 4, 5].map(n => {
                const hasCurrent = rowHasData(n)
                const hasPrev = n > 1 ? rowHasData(n - 1) : true
                const hasNextAny = [n + 1, n + 2, n + 3, n + 4, n + 5]
                  .filter(x => x <= 5)
                  .some(x => rowHasData(x))

                const isVisible = n <= 2 || hasCurrent || hasPrev || hasNextAny

                if (!isVisible) return null

                return (
                <tr key={n} className={`${n % 2 === 0 ? 'bg-amber-50/30' : 'bg-white'} h-11`}>
                  <td className={`sticky left-0 z-10 px-3 py-1 font-medium border-r border-slate-200 min-w-[100px] ${rowHasData(n) ? getCausaleStyle(
                    (causali.filter(c => c.numero === n && c.codice).sort((a,b) => (b.giorno||0)-(a.giorno||0))[0]?.codice || null)
                  ).bg || 'bg-amber-50' : 'bg-amber-50/40'} ${rowHasData(n) ? getCausaleStyle(
                    (causali.filter(c => c.numero === n && c.codice).sort((a,b) => (b.giorno||0)-(a.giorno||0))[0]?.codice || null)
                  ).text || 'text-amber-800' : 'text-slate-400'}`}>
                    {clearingRows.includes(n) ? (
                      <span className="text-red-500 text-[10px] animate-pulse">Pulizia...</span>
                    ) : confirmingRow === n ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-red-700">Cancellare?</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleClearRow(n) }}
                          className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded hover:bg-red-700"
                        >Sì</button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmingRow(null) }}
                          className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-300"
                        >No</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span>Causale {n}</span>
                        {!isConfermato && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmingRow(n) }}
                            className="p-1 text-amber-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Svuota riga causale"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  {days.map(d => {
                    const c = getCausale(d, n)
                    const oreLav = getGiornata(d)?.ore_lavorate ?? null
                    
                    // Calculate sum of OTHER causali for the same day
                    const otherCausaliSum = [1,2,3,4,5]
                      .filter(num => num !== n)
                      .reduce((acc, num) => acc + (getCausale(d, num)?.ore ?? 0), 0)

                    const overtimeDays = days.filter(dx => (getGiornata(dx)?.ore_lavorate || 0) > (getGiornata(dx)?.ore_contrattuali || 0))

                    if (isConfermato) {
                      const cs = getCausaleStyle(c?.codice || null)
                      return (
                        <td key={d} className="border border-slate-100 p-0 text-center text-xs relative h-11 min-w-[35px]" title={c?.note ? `Meteo/Nota: ${c.note}` : undefined}>
                          {c?.codice && (
                            <div className={`w-full h-full min-h-[44px] flex flex-col items-center justify-center ${cs.bg} ${cs.text} border-x border-black/5`}>
                              <span className="font-black text-[11px] leading-tight">{c.codice}</span>
                              {c?.ore ? <span className="text-[9px] font-medium opacity-80 leading-tight">{c.ore}h</span> : null}
                              {c?.note && (
                                <div className={`absolute top-1 right-1 w-1.5 h-1.5 ${cs.dot || 'bg-amber-400'} rounded-full ring-1 ring-white`} />
                              )}
                            </div>
                          )}
                        </td>
                      )
                    }
                    return (
                      <CausaleCell
                        key={d}
                        dipendente_id={dip.id}
                        giorno={d}
                        numero={n}
                        initial={getCausale(d, n) || { codice: null, ore: null, note: null }}
                        oreLavorate={getGiornata(d)?.ore_lavorate || null}
                        workedDays={days.filter(x => (getGiornata(x)?.ore_lavorate || 0) > 0)}
                        overtimeDays={overtimeDays}
                        isActive={activeCell === `${dip.id}-${d}-${n}`}
                        onToggle={(open) => onToggleCell(open ? `${dip.id}-${d}-${n}` : null)}
                        otherCausaliSum={otherCausaliSum}
                        daysInMonth={daysInMonth}
                        mese={mese}
                        anno={anno}
                        isEdile={isEdile}
                      />
                    )
                  })}
                  <td className="bg-amber-100/50 border border-amber-200 px-1 py-1 text-center font-bold text-amber-900 min-w-[45px] text-sm">
                    {days.reduce((acc, d) => acc + (getCausale(d, n)?.ore || 0), 0)}
                  </td>
                  {/* Summary Rows 3 and 4 individual */}
                  {n === 1 && (
                    <>
                      <td className={`${CAUSALE_COLORS['*ML'].riepilogoBg} border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*ML'].riepilogoText} font-normal uppercase tracking-wider`}>Malat</span>
                        {totals.malattia}
                      </td>
                      <td className={`${CAUSALE_COLORS['*IN'].riepilogoBg} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*IN'].riepilogoText} font-normal uppercase tracking-wider`}>Inf</span>
                        {totals.infortunio}
                      </td>
                      <td className={`${CAUSALE_COLORS['*MT'].riepilogoBg} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*MT'].riepilogoText} font-normal uppercase tracking-wider`}>Mat</span>
                        {totals.maternita}
                      </td>
                      <td className={`${CAUSALE_COLORS['*AT'].riepilogoBg} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*AT'].riepilogoText} font-normal uppercase tracking-wider`}>Allatt</span>
                        {totals.allattamento}
                      </td>
                    </>
                  )}
                  {n === 2 && (
                    <>
                      <td className={`${CAUSALE_COLORS['*DS'].riepilogoBg} border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*DS'].riepilogoText} font-normal uppercase tracking-wider`}>Donaz</span>
                        {totals.donazione}
                      </td>
                      <td className={`${CAUSALE_COLORS['*PE'].riepilogoBg} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*PE'].riepilogoText} font-normal uppercase tracking-wider`}>Perm</span>
                        {totals.permessi}
                      </td>
                      <td className={`${CAUSALE_COLORS['GEN'].riepilogoBg} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['GEN'].riepilogoText} font-normal uppercase tracking-wider`}>Caus</span>
                        {totals.altro}
                      </td>
                      <td className={`${CAUSALE_COLORS['*NP'].riepilogoBg} border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]`}>
                        <span className={`block text-[8px] ${CAUSALE_COLORS['*NP'].riepilogoText} font-normal uppercase tracking-wider`}>N.P.</span>
                        {totals.nonPagate}
                      </td>
                    </>
                  )}
                  {(n >= 3) && (
                    <td colSpan={4} className="border-l-2 border-l-slate-400 px-1 py-2"></td>
                  )}
                </tr>
              )})}

              {/* SEDE / Cantiere — editable */}
              <tr className="bg-slate-50 group/row h-11">
                <td className="sticky left-0 z-10 bg-slate-100 px-3 py-1 font-bold text-slate-700 border-r border-slate-200">
                  {cantieri.length > 0 ? 'Cantiere' : 'Sede'}
                </td>
                {days.map(d => {
                  const giornata = getGiornata(d)
                  const cellId = `sede-${dip.id}-${d}`
                  
                    if (isConfermato) {
                      const cStyle = getCantiereColor(giornata?.turno || null)
                      return (
                        <td key={d} className="border border-slate-100 p-0 text-center text-sm font-black h-11 min-w-[35px]">
                          {giornata?.turno && (
                            <div className={`w-full h-full min-h-[44px] flex items-center justify-center ${cStyle.bg} ${cStyle.text} border-x border-black/5`}>
                              <span className={giornata.turno.length > 2 ? 'text-[9px]' : 'text-[11px]'}>
                                {giornata.turno}
                              </span>
                            </div>
                          )}
                        </td>
                      )
                    }

                  return (
                    <td key={d} className="relative border border-slate-100 p-0 text-center text-slate-600 min-w-[35px] text-sm">
                      <SedeCell
                        dipendente_id={dip.id}
                        giorno={d}
                        valoreIniziale={giornata?.turno ?? null}
                        isActive={activeCell === cellId}
                        onToggle={(open) => onToggleCell(open ? cellId : null)}
                        cantieri={cantieri}
                        additionalSedi={additionalSedi}
                        profile={profile}
                        daysInMonth={daysInMonth}
                        mese={mese}
                        anno={anno}
                        workedDays={days.filter(x => (getGiornata(x)?.ore_lavorate || 0) > 0)}
                      />
                    </td>
                  )
                })}
                <td className="bg-slate-100 border border-slate-200 px-1 py-1 text-center font-bold text-slate-500 min-w-[45px]">
                  —
                </td>
                {/* Summary Space for Turno row */}
                <td className="bg-slate-50 border-l-2 border-l-slate-400" colSpan={4}></td>
              </tr>

              {/* DELETE PREVIOUS TOTALS ROW - Not needed anymore as it's in the grid */}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
// CIG Cantiere Card — vista tabellare calendario (ispirata all'allegato Excel)
function CigCantiereCard({
  cantiereCod,
  data,
  faseSalvata,
  cantiereInfo,
  onSave,
  savingFase,
  daysInMonth,
  anno,
  mese
}: {
  cantiereCod: string
  data: {
    oreTotali: number
    orePerGiorno: Record<number, number>
    dipPerGiorno: Record<number, number>
    dipendenti: { nome: string; giorni: Record<number, { codice: string; ore: number; meteo?: string }> }[]
  }
  faseSalvata: string
  cantiereInfo: any
  onSave: (cod: string, fase: string) => void
  savingFase: boolean
  daysInMonth: number
  anno: number
  mese: number
}) {
  const [localFase, setLocalFase] = useState(faseSalvata)
  const hasFase = faseSalvata.trim().length > 0
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Colonne che hanno almeno 1 ora CIG (per evidenziare)
  const activeDays = new Set(Object.keys(data.orePerGiorno).map(Number))

  const colW = 'min-w-[30px] max-w-[36px]'

  return (
    <div className={`rounded-xl border overflow-hidden ${
      hasFase ? 'border-green-300' : 'border-amber-300'
    }`}>
      {/* === Cantiere header bar === */}
      <div className={`px-4 py-2.5 flex items-center justify-between ${
        hasFase ? 'bg-green-600' : 'bg-[#4CAF50]'
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-lg tracking-tight">{cantiereCod}</span>
          {cantiereInfo?.cantiere && (
            <span className="text-white/90 font-semibold text-sm uppercase">{cantiereInfo.cantiere}</span>
          )}
          <span className="ml-2 text-white/70 text-xs font-medium">
            Tot. {data.oreTotali}h CIG
          </span>
        </div>
        {hasFase && (
          <span className="text-white/90 text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">
            ✓ Fase: {faseSalvata}
          </span>
        )}
      </div>

      {/* === Tabella calendario === */}
      <div className="overflow-x-auto">
        <table className="text-[11px] w-full border-collapse">
          <thead>
            {/* Riga ORE — totale per giorno */}
            <tr className="bg-[#4CAF50] border-b border-green-400">
              <td className="sticky left-0 z-10 bg-[#4CAF50] text-white font-bold px-2 py-1 min-w-[110px] border-r border-green-400">
                ore
              </td>
              {days.map(d => (
                <td key={d} className={`${colW} text-center py-1 font-bold text-white border-r border-green-400/50 ${
                  activeDays.has(d) ? 'bg-[#388E3C]' : ''
                }`}>
                  {data.orePerGiorno[d] || 0}
                </td>
              ))}
            </tr>

            {/* Riga DIP — n. dipendenti CIG per giorno */}
            <tr className="bg-[#66BB6A] border-b border-green-300">
              <td className="sticky left-0 z-10 bg-[#66BB6A] text-white font-bold px-2 py-1 min-w-[110px] border-r border-green-300">
                dip
              </td>
              {days.map(d => (
                <td key={d} className={`${colW} text-center py-1 font-bold text-white border-r border-green-300/50 ${
                  activeDays.has(d) ? 'bg-[#43A047]' : ''
                }`}>
                  {data.dipPerGiorno[d] || 0}
                </td>
              ))}
            </tr>

            {/* Riga numerazione giorni */}
            <tr className="bg-slate-100 border-b border-slate-200">
              <td className="sticky left-0 z-10 bg-slate-100 px-2 py-1 min-w-[110px] text-slate-500 font-bold text-[10px] border-r border-slate-200">
                {cantiereInfo?.cantiere
                  ? cantiereInfo.cantiere.substring(0, 18)
                  : cantiereCod}
              </td>
              {days.map(d => {
                const date = new Date(anno, mese - 1, d)
                const isDomenica = date.getDay() === 0
                const isF = isFestivo(anno, mese, d)
                const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().substring(0, 2)
                
                let cellClass = activeDays.has(d) ? 'bg-yellow-100 text-yellow-800' : 'text-slate-400'
                if (isDomenica) cellClass = 'bg-red-50 text-red-600'
                else if (isF) cellClass = 'bg-yellow-50 text-yellow-600'

                return (
                  <td key={d} className={`${colW} text-center py-0.5 font-bold border-r border-slate-200 leading-tight relative ${cellClass}`}>
                    <div className="text-[10px]">{d}</div>
                    <div className="text-[8px] opacity-70">{dayName}</div>
                    {/* Indicatore festivo su domenica */}
                    {isDomenica && isF && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-yellow-500 rounded-full" />
                    )}
                  </td>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {data.dipendenti.map((dip, di) => (
              <tr key={di} className={di % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                {/* Nome dipendente */}
                <td className="sticky left-0 z-10 bg-inherit px-2 py-1.5 min-w-[110px] font-semibold text-slate-700 border-r border-slate-100 truncate max-w-[110px]">
                  {dip.nome}
                </td>
                {/* Celle per giorno */}
                {days.map(d => {
                  const entry = dip.giorni[d]
                  const cs = entry ? getCausaleStyle(entry.codice) : null
                  return (
                    <td
                      key={d}
                      className={`${colW} text-center py-0.5 border-r border-slate-100 font-mono font-bold text-[9px] leading-tight ${
                        entry ? `${cs!.bg} ${cs!.text}` : ''
                      }`}
                      title={entry?.meteo ? `${entry.codice} — ${entry.ore}h — ${entry.meteo}` : entry ? `${entry.codice} ${entry.ore}h` : undefined}
                    >
                      {entry ? (
                        <>
                          <div className="text-[9px]">{entry.codice}</div>
                          <div className="text-[8px] opacity-70">{entry.ore}h</div>
                        </>
                      ) : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* === Fase lavorativa === */}
      <div className={`px-4 py-3 border-t ${
        hasFase ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}>
        <label className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 block ${
          hasFase ? 'text-green-700' : 'text-amber-700'
        }`}>
          Fase Lavorativa <span className="text-red-500">*</span>
          {hasFase && <span className="ml-2 text-green-600 normal-case font-normal">✓ Salvata</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localFase}
            onChange={e => setLocalFase(e.target.value)}
            placeholder="Es. Fondazioni, Muratura, Copertura..."
            className="flex-1 text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
          />
          <button
            onClick={() => onSave(cantiereCod, localFase)}
            disabled={savingFase || !localFase.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            {savingFase ? 'Salvataggio...' : 'Salva Fase'}
          </button>
        </div>
      </div>
    </div>
  )
}


function DipendenteSectionMobile({
  dip, daysInMonth, foglioStatus, activeCell, onToggleCell, cantieri, additionalSedi, profile, isEdile, anno, mese 
}: { 
  dip: Dipendente, 
  daysInMonth: number, 
  foglioStatus: string,
  activeCell: string | null,
  onToggleCell: (id: string | null) => void,
  cantieri: any[],
  additionalSedi: any[],
  profile: any,
  isEdile: boolean,
  anno: number,
  mese: number
}) {
  const [causali, setCausali] = useState(dip.causali)
  const isConfermato = foglioStatus === 'confermato' || foglioStatus === 'chiuso'

  useEffect(() => {
    setCausali(dip.causali)
  }, [dip.causali])

  const getGiornata = (g: number) => dip.giornate.find(x => x.giorno === g)
  const getCausale = (g: number, n: number) => causali.find(c => c.giorno === g && c.numero === n)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Summary Totals logic (same as desktop)
  const summary = { ordinarie: 0, straordinario: 0, giorniLavorati: 0, codici: {} as Record<string, number> }
  days.forEach(d => {
    const giornata = getGiornata(d)
    const oreLavorateEffettive = giornata?.ore_lavorate ?? 0
    const oreContrattuali = giornata?.ore_contrattuali ?? 0
    if (oreLavorateEffettive > oreContrattuali) summary.straordinario += (oreLavorateEffettive - oreContrattuali)
    let oreGiustificateGiorno = 0
    for(let n=1; n<=5; n++) {
      const c = getCausale(d, n)
      if (c?.ore && c.codice) {
        summary.codici[c.codice] = (summary.codici[c.codice] || 0) + c.ore
        oreGiustificateGiorno += c.ore
      }
    }
    const basePerOrdinarie = Math.min(oreLavorateEffettive, oreContrattuali)
    const effectiveOrd = Math.max(0, basePerOrdinarie - oreGiustificateGiorno)
    summary.ordinarie += effectiveOrd
    if (effectiveOrd > 0) summary.giorniLavorati++
  })

  const getSum = (codes: string[]) => codes.reduce((acc, code) => acc + (summary.codici[code] || 0), 0)
  const totals = {
    ferie: getSum(['*FE', '*FD']),
    permessi: getSum(['*PE', '*PD', '*PA']),
    rol: getSum(['*RO']),
    festivita: getSum(['*EF']),
    malattia: getSum(['*ML']),
    infortunio: getSum(['*IN']),
    maternita: getSum(['*MT', '*MO']),
    allattamento: getSum(['*AT']),
    donazione: getSum(['*DS']),
    altro: getSum(['GEN']),
    nonPagate: getSum(['*NP']),
    cig: getSum(['*GG', '*GH', '*GJ', '*GK']),
  }
  const totaleOre = summary.ordinarie + totals.ferie + totals.permessi + totals.rol + totals.festivita + totals.malattia + totals.infortunio + totals.maternita + totals.allattamento + totals.donazione + totals.altro
  const giorniRetribuiti = summary.giorniLavorati + (totals.ferie > 0 ? 1 : 0)

  const rotatedHeaderClass = "[writing-mode:vertical-rl] rotate-180 py-2 px-1 text-[10px] font-bold uppercase tracking-tighter h-24 min-w-[32px] border-l border-slate-200"

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-500">
              <th className="sticky left-0 z-20 bg-slate-100 p-2 text-[10px] font-black border-r border-slate-200 min-w-[50px]">GG</th>
              <th className={rotatedHeaderClass}>Lavorate</th>
              <th className={rotatedHeaderClass}>Notturne</th>
              <th className={rotatedHeaderClass}>Causale 1</th>
              <th className={rotatedHeaderClass}>Causale 2</th>
              <th className={rotatedHeaderClass}>Causale 3</th>
              <th className={rotatedHeaderClass}>Causale 4</th>
              <th className={rotatedHeaderClass}>Causale 5</th>
              <th className={rotatedHeaderClass}>Cantiere</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const date = new Date(anno, mese - 1, d)
              const isDomenica = date.getDay() === 0
              const isF = isFestivo(anno, mese, d)
              const dayName = date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase().substring(0, 2)
              const giornata = getGiornata(d)
              const lavorateNum = Number(giornata?.ore_lavorate || 0)
              const contrattualiNum = Number(giornata?.ore_contrattuali || 0)
              const isStraordinario = lavorateNum > contrattualiNum
              const isOverLimit = lavorateNum > 12
              
              let dayColor = d % 2 === 0 ? 'bg-slate-50' : 'bg-white'
              if (isDomenica) dayColor = 'bg-red-50/50'
              else if (isF) dayColor = 'bg-yellow-50/50'
              
              let cellBg = ''
              if (isOverLimit) cellBg = 'bg-red-100/50'
              else if (isStraordinario) cellBg = 'bg-amber-100/30'

              return (
                <tr key={d} className={`${dayColor} border-b border-slate-100 h-11`}>
                  <td className="sticky left-0 z-10 bg-inherit border-r border-slate-200 p-1 text-center relative">
                    <div className={`text-[11px] font-black ${isDomenica ? 'text-red-600' : isF ? 'text-amber-600' : 'text-slate-900'}`}>{d}</div>
                    <div className="text-[8px] font-bold opacity-50 uppercase">{dayName}</div>
                    {isDomenica && isF && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-400 rounded-full" />}
                  </td>
                  
                  {/* Lavorate */}
                  <td className={`p-0 border-r border-slate-100 ${cellBg}`}>
                    {isConfermato ? (
                      <div className={`h-11 flex items-center justify-center text-xs font-bold ${isOverLimit ? 'text-red-800' : isStraordinario ? 'text-amber-800' : ''}`}>
                        {giornata?.ore_lavorate != null ? Math.max(0, giornata.ore_lavorate - [1,2,3,4,5].reduce((a, n) => a + (getCausale(d, n)?.ore ?? 0), 0)) : ''}
                      </div>
                    ) : (
                      <GiornataCell
                        dipendente_id={dip.id} giorno={d} campo="ore_lavorate" valoreIniziale={giornata?.ore_lavorate ?? null}
                        valoreContrattuale={giornata?.ore_contrattuali ?? 0}
                        displayValore={giornata?.ore_lavorate != null ? Math.max(0, (giornata.ore_lavorate || 0) - [1,2,3,4,5].reduce((a, n) => a + (getCausale(d, n)?.ore ?? 0), 0)) : null}
                        daysInMonth={daysInMonth} mese={mese} anno={anno}
                        isActive={activeCell === `mob-lav-${dip.id}-${d}`}
                        onToggle={(open) => onToggleCell(open ? `mob-lav-${dip.id}-${d}` : null)}
                        isStraordinario={isStraordinario}
                        isOverLimit={isOverLimit}
                      />
                    )}
                  </td>

                  {/* Notturne */}
                  <td className="p-0 border-r border-slate-100">
                    {isConfermato ? (
                      <div className="h-11 flex items-center justify-center text-xs font-bold text-indigo-600">
                        {giornata?.ore_notturne || ''}
                      </div>
                    ) : (
                      <GiornataCell
                        dipendente_id={dip.id} giorno={d} campo="ore_notturne" valoreIniziale={giornata?.ore_notturne ?? null}
                        valoreContrattuale={giornata?.ore_lavorate ?? 0} displayValore={giornata?.ore_notturne ?? null}
                        daysInMonth={daysInMonth} mese={mese} anno={anno}
                        isActive={activeCell === `mob-not-${dip.id}-${d}`}
                        onToggle={(open) => onToggleCell(open ? `mob-not-${dip.id}-${d}` : null)}
                      />
                    )}
                  </td>

                  {/* Causali 1-5 */}
                  {[1, 2, 3, 4, 5].map(n => (
                    <CausaleCell
                      key={n} dipendente_id={dip.id} giorno={d} numero={n}
                      initial={getCausale(d, n) || { codice: null, ore: null, note: null }}
                      oreLavorate={giornata?.ore_lavorate || null}
                      workedDays={days.filter(x => (getGiornata(x)?.ore_lavorate || 0) > 0)}
                      overtimeDays={days.filter(dx => (getGiornata(dx)?.ore_lavorate || 0) > (getGiornata(dx)?.ore_contrattuali || 0))}
                      isActive={activeCell === `mob-cau-${dip.id}-${d}-${n}`}
                      onToggle={(open) => onToggleCell(open ? `mob-cau-${dip.id}-${d}-${n}` : null)}
                      otherCausaliSum={[1,2,3,4,5].filter(num => num !== n).reduce((acc, num) => acc + (getCausale(d, num)?.ore ?? 0), 0)}
                      daysInMonth={daysInMonth} mese={mese} anno={anno} isEdile={isEdile}
                    />
                  ))}

                  {/* Cantiere */}
                  <td className="p-0">
                    <SedeCell
                      dipendente_id={dip.id} giorno={d} valoreIniziale={giornata?.turno ?? null}
                      isActive={activeCell === `mob-sede-${dip.id}-${d}`}
                      onToggle={(open) => onToggleCell(open ? `mob-sede-${dip.id}-${d}` : null)}
                      cantieri={cantieri} additionalSedi={additionalSedi} profile={profile}
                      daysInMonth={daysInMonth} mese={mese} anno={anno}
                      workedDays={days.filter(x => (getGiornata(x)?.ore_lavorate || 0) > 0)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Summary at Bottom */}
      <div className="bg-slate-50 p-4 border-t-2 border-slate-200">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-center">Riepilogo Mensile</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-blue-700">HH LAV</span>
            <span className="text-sm font-black text-blue-900">{summary.ordinarie}</span>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-emerald-700">HH RETR</span>
            <span className="text-sm font-black text-emerald-900">{totaleOre}</span>
          </div>
          <div className="bg-amber-50 p-2 rounded-lg border border-amber-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-amber-700">STRAORD</span>
            <span className="text-sm font-black text-amber-900">{summary.straordinario}</span>
          </div>
          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600">GG LAV</span>
            <span className="text-sm font-black text-slate-900">{summary.giorniLavorati}</span>
          </div>
        </div>

        {/* Justifications Grid */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {Object.entries(totals).filter(([_, val]) => val > 0).map(([key, val]) => {
            const cs = getCausaleStyle(key === 'ferie' ? '*FE' : key === 'permessi' ? '*PE' : key === 'malattia' ? '*ML' : key === 'infortunio' ? '*IN' : key === 'maternita' ? '*MT' : key === 'cig' ? '*GG' : 'GEN')
            return (
              <div key={key} className={`${cs.riepilogoBg || 'bg-white'} p-1.5 rounded-lg border border-slate-100 flex flex-col items-center`}>
                <span className={`text-[8px] font-bold uppercase ${cs.riepilogoText || 'text-slate-400'}`}>{key}</span>
                <span className="text-xs font-black">{val}h</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}


// Main component
export default function FoglioPresenze({
  foglioId, azienda, sede, anno, mese, status, dipendenti: initialDipendenti,
  cantieri, additionalSedi, profile, cigFasi: initialCigFasi, readOnly, onBack
}: FoglioPresenzaProps) {
  const [selectedDipMobile, setSelectedDipMobile] = useState(initialDipendenti[0]?.id)
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [showLegenda, setShowLegenda] = useState(false)
  const [sending, startSend] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCigDash, setShowCigDash] = useState(false)
  const [cigFasi, setCigFasi] = useState<{ cantiere_cod: string; fase_lavorativa: string }[]>(initialCigFasi || [])
  const [savingFase, setSavingFase] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const daysInMonth = getDaysInMonth(anno, mese)
  const isConfermato = readOnly || status === 'confermato' || status === 'chiuso'
  const isEdile = !!(profile?.is_edile)
  const elencoCausali = getElencoCausali(isEdile)

  // Struttura CIG per cantiere: per ogni cantiere, per ogni giorno, per ogni dipendente
  type CigDayEntry = { codice: string; ore: number; meteo?: string }
  type CigCantiereData = {
    oreTotali: number
    orePerGiorno: Record<number, number>   // giorno → ore totali
    dipPerGiorno: Record<number, number>   // giorno → n. dipendenti coinvolti
    dipendenti: {
      nome: string
      giorni: Record<number, CigDayEntry>  // giorno → entry CIG
    }[]
  }

  const cigByCantiere = (() => {
    const map: Record<string, CigCantiereData> = {}
    initialDipendenti.forEach(dip => {
      dip.giornate.forEach(g => {
        const turno = g.turno
        if (!turno) return
        const cigCausali = (dip.causali || []).filter(c =>
          c.giorno === g.giorno && (CIG_CODES as readonly string[]).includes(c.codice || '')
        )
        if (cigCausali.length === 0) return

        if (!map[turno]) map[turno] = { oreTotali: 0, orePerGiorno: {}, dipPerGiorno: {}, dipendenti: [] }
        const ct = map[turno]

        cigCausali.forEach(c => {
          const ore = c.ore || 0
          ct.oreTotali += ore
          ct.orePerGiorno[g.giorno] = (ct.orePerGiorno[g.giorno] || 0) + ore
          ct.dipPerGiorno[g.giorno] = (ct.dipPerGiorno[g.giorno] || 0) + 1

          let dipEntry = ct.dipendenti.find(d => d.nome === dip.cognome_nome)
          if (!dipEntry) {
            dipEntry = { nome: dip.cognome_nome, giorni: {} }
            ct.dipendenti.push(dipEntry)
          }
          dipEntry.giorni[g.giorno] = { codice: c.codice!, ore, meteo: c.note || undefined }
        })
      })
    })
    return map
  })()

  const hasCig = Object.keys(cigByCantiere).length > 0

  // Validazione: cantieri con CIG ma senza fase lavorativa
  const cantieriSenzaFase = Object.keys(cigByCantiere).filter(cod => {
    const faseSalvata = cigFasi.find(f => f.cantiere_cod === cod)
    return !faseSalvata?.fase_lavorativa?.trim()
  })
  const cigValid = cantieriSenzaFase.length === 0

  function getFaseLavorativa(cantiereCod: string): string {
    return cigFasi.find(f => f.cantiere_cod === cantiereCod)?.fase_lavorativa || ''
  }

  async function handleSaveFase(cantiereCod: string, fase: string) {
    setSavingFase(true)
    try {
      const { saveCigFase } = await import('@/app/actions/cig')
      await saveCigFase(foglioId, cantiereCod, fase)
      setCigFasi(prev => {
        const next = prev.filter(f => f.cantiere_cod !== cantiereCod)
        return [...next, { cantiere_cod: cantiereCod, fase_lavorativa: fase }]
      })
    } catch (e: any) {
      setError(`Errore salvataggio fase: ${e.message}`)
    } finally {
      setSavingFase(false)
    }
  }

  function handleConfirm() {
    console.log("[handleConfirm] Richiesta conferma invio. foglioId:", foglioId)
    if (isEdile && hasCig && !cigValid) {
      const msg = `⚠️ Compilare la Fase Lavorativa per i cantieri: ${cantieriSenzaFase.join(', ')}. Apri la Dashboard CIG per completare.`
      setError(msg)
      return
    }
    setShowConfirmModal(true)
  }

  async function processConfirm() {
    setShowConfirmModal(false)
    setError(null)
    console.log("[processConfirm] Avvio invio definitivo...")
    
    startSend(async () => {
      try {
        await confirmAndSend(foglioId)
        setSent(true)
        console.log("[processConfirm] Invio completato")
      } catch (e: any) {
        console.error("[processConfirm] Errore:", e)
        setError(e.message || "Errore durante l'invio")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
           {onBack && (
             <button 
               onClick={onBack}
               className="p-2 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 text-slate-500"
               title="Torna alla Dashboard"
             >
               <ChevronDown className="h-5 w-5 rotate-90" />
             </button>
           )}
           <div>
            <h2 className="text-xl font-bold text-slate-900">
              {azienda} {sede ? `— ${sede}` : ''}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Periodo: <span className="text-slate-900">{MESI[mese]} {anno}</span> &middot; {initialDipendenti.length} dipendenti
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 ${
            status === 'confermato' || sent ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
            status === 'chiuso' ? 'bg-slate-100 text-slate-600 border-slate-200' :
            'bg-amber-50 text-amber-700 border-amber-100'
          }`}>
            {status === 'confermato' || sent ? <CheckCircle className="h-3.5 w-3.5" /> : 
             status === 'chiuso' ? <Lock className="h-3.5 w-3.5" /> :
             <Info className="h-3.5 w-3.5" />}
            {status === 'confermato' || sent ? 'Inviato' : status === 'chiuso' ? 'Chiuso' : 'Bozza'}
          </div>

          {/* Dashboard CIG — solo edili, solo se ci sono ore CIG */}
          {isEdile && hasCig && (
            <button
              onClick={() => setShowCigDash(true)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                !cigValid
                  ? 'border-amber-400 bg-amber-50 text-amber-700 animate-pulse'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              🏗️ Dashboard CIG
              {!cigValid && <span className="ml-1 bg-amber-500 text-white rounded-full px-1.5 py-0.5 text-[9px] font-black">{cantieriSenzaFase.length}</span>}
            </button>
          )}

          {/* Legenda toggle */}
          <button
            onClick={() => setShowLegenda(!showLegenda)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Info className="h-3.5 w-3.5" />
            Legenda
          </button>

          {/* Confirm button */}
          {!isConfermato && !sent && (
            <button
              onClick={handleConfirm}
              disabled={sending || (isEdile && hasCig && !cigValid)}
              title={isEdile && hasCig && !cigValid ? `Completa le fasi lavorative CIG prima di inviare (${cantieriSenzaFase.join(', ')})` : undefined}
              className="flex items-center gap-2 rounded-xl bg-[#D32F2F] px-5 py-2 text-sm font-bold text-white hover:bg-[#b02727] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-900/10 transition-all"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Invio...' : 'Conferma e Invia'}
            </button>
          )}
        </div>
      </div>

      {isConfermato && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3 text-blue-800 shadow-sm">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Questo foglio è in modalità <strong>sola lettura</strong> perché è già stato inviato o chiuso.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          Errore: {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-red-500">Chiudi</button>
        </div>
      )}

      {/* Legenda */}
      {showLegenda && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-2">Legenda Causali</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
            {elencoCausali.map(g => {
              const cs = getCausaleStyle(g.codice)
              return (
                <div key={g.codice} className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1.5 ${cs.bg || 'bg-amber-50'}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cs.dot || 'bg-amber-400'}`} />
                  <span className={`font-mono font-bold ${cs.text}`}>{g.codice}</span>
                  <span className="text-slate-600">— {g.label}</span>
                </div>
              )
            })}
            {isEdile && CIG_OPZIONI.map(o => {
              const cs = getCausaleStyle(o.codice)
              return (
                <div key={o.codice} className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1.5 ${cs.bg}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cs.dot}`} />
                  <span className={`font-mono font-bold ${cs.text}`}>{o.codice}</span>
                  <span className="text-slate-600">— {o.label}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Clicca su una cella causale per modificarla.
          </p>
        </div>
      )}

      {/* Mobile Employee Selector */}
      <div className="block md:hidden mb-2">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            <Users className="h-3 w-3" />
            Seleziona Dipendente
          </label>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
             {initialDipendenti.map(dip => (
               <button
                 key={dip.id}
                 onClick={() => setSelectedDipMobile(dip.id)}
                 className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                   selectedDipMobile === dip.id 
                    ? 'bg-[#D32F2F] text-white border-[#D32F2F] shadow-lg shadow-red-900/10' 
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                 }`}
               >
                 {dip.cognome_nome}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Desktop Version */}
      <div className="hidden md:block space-y-6">
        {initialDipendenti.map(dip => (
          <DipendenteSectionDesktop
            key={dip.id}
            dip={dip}
            daysInMonth={daysInMonth}
            foglioStatus={status}
            activeCell={activeCell}
            onToggleCell={setActiveCell}
            cantieri={cantieri}
            additionalSedi={additionalSedi}
            profile={profile}
            isEdile={isEdile}
            anno={anno}
            mese={mese}
          />
        ))}
      </div>

      {/* Mobile Version */}
      <div className="block md:hidden">
        {initialDipendenti.filter(d => d.id === selectedDipMobile).map(dip => (
          <DipendenteSectionMobile
            key={dip.id}
            dip={dip}
            daysInMonth={daysInMonth}
            foglioStatus={status}
            activeCell={activeCell}
            onToggleCell={setActiveCell}
            cantieri={cantieri}
            additionalSedi={additionalSedi}
            profile={profile}
            isEdile={isEdile}
            anno={anno}
            mese={mese}
          />
        ))}
      </div>

      {/* CIG Dashboard Modal */}
      {showCigDash && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">🏗️ Dashboard CIG</h2>
                <p className="text-xs text-slate-500">{MESI[mese]} {anno} — {azienda}</p>
              </div>
              <button onClick={() => setShowCigDash(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-4 space-y-4">
              {Object.entries(cigByCantiere).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">Nessuna ora CIG registrata in questo mese.</p>
              )}
              {Object.entries(cigByCantiere).map(([cantiereCod, data]) => (
                <CigCantiereCard
                  key={cantiereCod}
                  cantiereCod={cantiereCod}
                  data={data}
                  faseSalvata={getFaseLavorativa(cantiereCod)}
                  cantiereInfo={cantieri.find(c => (c.cod || c.cantiere) === cantiereCod)}
                  onSave={handleSaveFase}
                  savingFase={savingFase}
                  daysInMonth={daysInMonth}
                  anno={anno}
                  mese={mese}
                />
              ))}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">
                {cigValid ? '✓ Tutte le fasi lavorative sono state compilate.' : `⚠️ ${cantieriSenzaFase.length} cantiere/i senza fase lavorativa.`}
              </p>
              <button
                onClick={() => setShowCigDash(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal di Conferma Invio */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-red-50 text-[#D32F2F] rounded-full flex items-center justify-center mb-6">
                <Send className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Conferma l'invio?</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Stai per inviare il foglio presenze di <span className="font-bold text-slate-900">{MESI[mese]} {anno}</span>.<br />
                Una volta inviato, i dati non potranno più essere modificati.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Annulla
                </button>
                <button
                  onClick={processConfirm}
                  className="px-6 py-3 rounded-2xl bg-[#D32F2F] text-white text-sm font-bold hover:bg-[#b02727] shadow-lg shadow-red-900/20 transition-all"
                >
                  Sì, Invia ora
                </button>
              </div>
            </div>
            <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Azione Irreversibile</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
