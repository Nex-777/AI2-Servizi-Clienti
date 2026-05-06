'use client'

import { useState, useTransition, useEffect } from 'react'
import { ChevronDown, CheckCircle, Send, Info, Trash2 } from 'lucide-react'
import { saveCausale, confirmAndSend, clearCausaleRow, saveGiornata } from '@/app/actions/confirm'

const GIUSTIFICATIVI = [
  { codice: '*FE', label: 'Ferie' },
  { codice: '*PE', label: 'Permessi' },
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

// Inline editable giornata cell for ordinary and night hours
function GiornataCell({
  dipendente_id,
  giorno,
  campo, // 'ore_lavorate' | 'ore_notturne'
  valoreIniziale,
  valoreTeorico, // Added theoretical reference
  displayValore, // Value to display when not editing
  daysInMonth,
  isActive,
  onToggle
}: {
  dipendente_id: string
  giorno: number
  campo: string
  valoreIniziale: number | null
  valoreTeorico: number | null
  displayValore: number | null
  daysInMonth: number
  isActive: boolean
  onToggle: (open: boolean) => void
}) {
  const [valore, setValore] = useState(valoreIniziale !== null ? String(valoreIniziale) : '')
  const [alGiorno, setAlGiorno] = useState(giorno)
  const [saving, startSave] = useTransition()

  // Sync state with server props
  useEffect(() => {
    if (!isActive) {
      setValore(valoreIniziale !== null ? String(valoreIniziale) : '')
    }
  }, [valoreIniziale, isActive])

  function handleSave() {
    // Se stiamo modificando le ore lavorate, impediamo la riduzione sotto le teoriche
    if (campo === 'ore_lavorate' && valoreTeorico !== null) {
      const v = parseFloat(valore) || 0
      if (v < valoreTeorico) {
        alert(`Le ore lavorate non possono essere inferiori alle ore teoriche (${valoreTeorico}h).`)
        return
      }
    }

    const fd = new FormData()
    fd.set('dipendente_id', dipendente_id)
    fd.set('giorno', String(giorno))
    fd.set('alGiorno', String(alGiorno))
    fd.set('campo', campo)
    fd.set('valore', valore)

    startSave(() => {
      saveGiornata(fd).then(() => onToggle(false)).catch(e => alert(e.message))
    })
  }

  const label = campo === 'ore_lavorate' ? 'Ore Lavorate' : 'Di cui notturne'

  return (
    <div className="relative h-full w-full group">
      <div
        onClick={() => onToggle(!isActive)}
        className="flex h-full w-full cursor-pointer items-center justify-center transition-colors hover:bg-slate-100/80"
      >
        {displayValore !== null ? displayValore : ''}
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
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Dal</label>
                  <div className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">Giorno {giorno}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Al</label>
                  <select
                    value={alGiorno}
                    onChange={e => setAlGiorno(parseInt(e.target.value))}
                    className="w-full text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                  >
                    {Array.from({ length: daysInMonth - giorno + 1 }, (_, i) => giorno + i).map(d => (
                      <option key={d} value={d}>Giorno {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => onToggle(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 rounded-xl bg-[#D32F2F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#b02727] disabled:opacity-50 shadow-lg shadow-red-900/10 transition-all"
                >
                  {saving ? 'Salvataggio...' : 'Conferma'}
                </button>
              </div>
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
  daysInMonth
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
}) {
  const [codice, setCodice] = useState(initial.codice || '')
  const [ore, setOre] = useState(initial.ore !== null ? String(initial.ore) : '')
  const [note, setNote] = useState(initial.note || '')
  const [alGiorno, setAlGiorno] = useState(giorno)
  const [saving, startSave] = useTransition()
  const [validationError, setValidationError] = useState<string | null>(null)
  const [hasChanged, setHasChanged] = useState(false)

  // Track changes to trigger auto-save logic
  useEffect(() => {
    if (codice !== (initial.codice || '') || ore !== (initial.ore !== null ? String(initial.ore) : '')) {
      setHasChanged(true)
    }
  }, [codice, ore, initial])

  // Sync state with server props (for when range save updates other cells)
  useEffect(() => {
    if (!isActive) {
      setCodice(initial.codice || '')
      setOre(initial.ore !== null ? String(initial.ore) : '')
      setNote(initial.note || '')
    }
  }, [initial.codice, initial.ore, initial.note, isActive])

  // Pre-fill remaining hours when opening if empty
  useEffect(() => {
    if (isActive && !ore && oreLavorate !== null) {
      const remaining = Math.max(0, oreLavorate - otherCausaliSum)
      if (remaining > 0) setOre(String(remaining))
    }
  }, [isActive, ore, oreLavorate, otherCausaliSum])

  // Auto-save when closing (Singleton logic)
  useEffect(() => {
    if (!isActive && hasChanged) {
      if (codice) {
        const oreNum = ore ? parseFloat(ore) : 0
        const totalDayHours = (oreLavorate || 0)
        if (oreNum + otherCausaliSum <= totalDayHours) {
          const fd = new FormData()
          fd.set('dipendente_id', dipendente_id)
          fd.set('giorno', String(giorno))
          fd.set('numero', String(numero))
          fd.set('codice', codice)
          fd.set('ore', ore)
          fd.set('note', note)
          fd.set('alGiorno', String(alGiorno))
          saveCausale(fd)
        }
      }
      setHasChanged(false)
    }
  }, [isActive, hasChanged, codice, ore, note, alGiorno, dipendente_id, giorno, numero, otherCausaliSum, oreLavorate])

  function handleSave() {
    setValidationError(null)
    const oreNum = ore ? parseFloat(ore) : 0
    const totalDayHours = (oreLavorate || 0)

    // Validation: current cell + others cannot exceed total
    if (oreNum + otherCausaliSum > totalDayHours) {
      setValidationError(`Totale giornaliero superato (${oreNum + otherCausaliSum}h > ${totalDayHours}h)`)
      return
    }

    let finalCodice = codice
    let finalOre = ore

    if (!codice) {
      // If "Nessuno" is selected, we clear the hours too
      finalCodice = ''
      finalOre = ''
    } else {
      if (oreNum <= 0) {
        setValidationError("Inserire le ore")
        return
      }
    }

    const fd = new FormData()
    fd.set('dipendente_id', dipendente_id)
    fd.set('giorno', String(giorno))
    fd.set('numero', String(numero))
    fd.set('codice', finalCodice)
    fd.set('ore', finalOre)
    fd.set('note', note)
    fd.set('alGiorno', String(alGiorno))
    startSave(() => saveCausale(fd).then(() => onToggle(false)))
  }

  return (
    <td className="border border-slate-100 p-0 relative min-w-[32px]">
      <button
        onClick={() => onToggle(!isActive)}
        className={`w-full h-full min-h-[28px] px-0.5 py-0.5 text-center text-[10px] transition-colors relative ${
          codice ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-300'
        }`}
        title={note ? `Note: ${note}` : undefined}
      >
        {codice || '—'}
        {ore ? <span className="block text-[9px] text-amber-700/70">{ore}h</span> : null}
        {note && (
          <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-amber-600 rounded-full" />
        )}
      </button>

      {isActive && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Modifica Giustificativo</h3>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">Giorno {giorno} — Caus. {numero}</span>
            </div>
            
            {oreLavorate !== null && (
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                Ore ordinarie disponibili: <strong>{oreLavorate}h</strong>
                <br/>
                <span className="text-[10px] opacity-80">Rimanenti dopo altri giustificativi: {Math.max(0, oreLavorate - otherCausaliSum)}h</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tipo Giustificativo</label>
                <select
                  value={codice}
                  onChange={e => {
                    const val = e.target.value
                    setCodice(val)
                    if (!val) {
                      setOre('')
                      setNote('')
                    }
                  }}
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                >
                  <option value="">— Nessuno —</option>
                  {GIUSTIFICATIVI.map(g => (
                    <option key={g.codice} value={g.codice}>{g.codice} — {g.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Ore</label>
                <input
                  type="number"
                  value={ore}
                  onChange={e => setOre(e.target.value)}
                  placeholder={oreLavorate ? `Max ${oreLavorate}h` : 'Ore'}
                  max={oreLavorate ?? undefined}
                  min={0}
                  step={0.5}
                  className={`w-full text-sm rounded-xl border bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all ${
                    validationError ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
              </div>

              {/* Range Selection */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Dal</label>
                  <div className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">Giorno {giorno}</div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Al</label>
                  <select
                    value={alGiorno}
                    onChange={e => setAlGiorno(parseInt(e.target.value))}
                    className="w-full text-sm font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:ring-2 focus:ring-[#D32F2F]/20 focus:border-[#D32F2F] transition-all"
                  >
                    {Array.from({ length: daysInMonth - giorno + 1 }, (_, i) => giorno + i).map(d => (
                      <option key={d} value={d}>Giorno {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes for GEN */}
              {codice === 'GEN' && (
                <div className="space-y-1">
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

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { onToggle(false); setValidationError(null) }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#D32F2F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#b02727] disabled:opacity-50 shadow-lg shadow-red-900/10 transition-all"
              >
                {saving ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </td>
  )
}

// Single employee table section
function DipendenteSection({ dip, daysInMonth, foglioStatus, activeCell, onToggleCell }: {
  dip: Dipendente
  daysInMonth: number
  foglioStatus: string
  activeCell: string | null
  onToggleCell: (cellId: string | null) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [clearingRows, setClearingRows] = useState<number[]>([])
  const [confirmingRow, setConfirmingRow] = useState<number | null>(null)
  // Local causali state — initialized from props, updated optimistically on clear
  const [causali, setCausali] = useState(dip.causali)
  const isConfermato = foglioStatus === 'confermato'

  // Sync causali when dip prop changes (e.g. after server revalidation)
  useEffect(() => {
    setCausali(dip.causali)
  }, [dip.causali])

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
    
    // Le ordinarie pagate sono le lavorate effettive meno i giustificativi (ferie, permessi ecc)
    // MA non devono superare le teoriche (perché l'eccedenza è già nello straordinario)
    const basePerOrdinarie = Math.min(oreLavorateEffettive, oreContrattuali)
    const effectiveOrd = Math.max(0, basePerOrdinarie - oreGiustificateGiorno)
    
    summary.ordinarie += effectiveOrd
    if (effectiveOrd > 0) summary.giorniLavorati++
  })

  // Helper for summary grid
  const getSum = (codes: string[]) => codes.reduce((acc, code) => acc + (summary.codici[code] || 0), 0)
  
  const totals = {
    ferie: getSum(['*FE']),
    permessi: getSum(['*PE', '*PA']),
    rol: getSum(['*RO']),
    festivita: getSum(['*EF']),
    malattia: getSum(['*ML']),
    infortunio: getSum(['*IN']),
    maternita: getSum(['*MT', '*MO']),
    allattamento: getSum(['*AT']),
    donazione: getSum(['*DS']),
    altro: getSum(['GEN']),
    nonPagate: getSum(['*NP']),
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
                {days.map(d => (
                  <th key={d} className="px-1 py-2 text-center min-w-[35px] font-bold border-l border-slate-600 text-[11px]">
                    {d}
                  </th>
                ))}
                {/* 4x4 Summary Grid Headers */}
                <th colSpan={4} className="bg-slate-800 px-2 py-3 text-sm font-bold text-center border-l border-slate-600">Riepilogo Mensile</th>
              </tr>
            </thead>
            <tbody>
              {/* Contrattuali — read only */}
              <tr className="bg-slate-50/30">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-slate-500 font-medium border-r border-slate-200">
                  Contrattuali
                </td>
                {days.map(d => (
                  <td key={d} className="border border-slate-100 px-0.5 py-1 text-center text-slate-400 font-medium">
                    {getGiornata(d)?.ore_contrattuali || ''}
                  </td>
                ))}
                <td className="bg-slate-50 border-l-2 border-l-slate-400" colSpan={4}></td>
              </tr>

              {/* Ore lavorate — editable */}
              <tr className="bg-white group/row">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 border-r border-slate-200">
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
                  return (
                    <td key={d} className="relative border border-slate-100 p-0 text-center text-slate-900 font-bold text-sm min-w-[35px]">
                      {isConfermato ? (
                         <div className="flex h-full w-full items-center justify-center p-1.5">
                           {effectiveOre !== null ? effectiveOre : ''}
                         </div>
                      ) : (
                         <GiornataCell
                           dipendente_id={dip.id}
                           giorno={d}
                           campo="ore_lavorate"
                           valoreIniziale={origOre}
                           valoreTeorico={giornata?.ore_contrattuali ?? 0}
                           displayValore={effectiveOre}
                           daysInMonth={daysInMonth}
                           isActive={activeCell === cellId}
                           onToggle={(open) => onToggleCell(open ? cellId : null)}
                         />
                      )}
                    </td>
                  )
                })}
                {/* Summary Row 1 */}
                <td className="bg-blue-50 border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">HH Lav</span>
                  {summary.ordinarie}
                </td>
                <td className="bg-blue-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">GG Lav</span>
                  {summary.giorniLavorati}
                </td>
                <td className="bg-blue-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">Straor.</span>
                  {summary.straordinario}
                </td>
                <td className="bg-blue-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 min-w-[75px] text-sm">
                  <span className="block text-[8px] text-blue-600 font-normal uppercase tracking-wider">Ferie</span>
                  {totals.ferie}
                </td>
              </tr>

              {/* Ore notturne — read only */}
              <tr className="bg-slate-50/50">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-slate-500 border-r border-slate-200">
                  di cui notturne
                </td>
                {days.map(d => (
                  <td key={d} className="border border-slate-100 px-0.5 py-1.5 text-center text-slate-500 min-w-[35px] text-sm">
                    {getGiornata(d)?.ore_notturne || ''}
                  </td>
                ))}
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

              {/* Causali 1-5 — editable */}
              {[1, 2, 3, 4, 5].map(n => (
                <tr key={n} className={n % 2 === 0 ? 'bg-amber-50/30' : 'bg-white'}>
                  <td className="sticky left-0 z-10 bg-amber-50 px-3 py-1.5 text-amber-800 font-medium border-r border-slate-200 min-w-[100px]">
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

                    if (isConfermato) {
                      return (
                        <td key={d} className="border border-slate-100 px-1 py-1 text-center text-xs relative" title={c?.note ? `Note: ${c.note}` : undefined}>
                          {c?.codice ? (
                            <span className="text-amber-700 font-semibold">{c.codice}</span>
                          ) : ''}
                          {c?.ore ? <span className="block text-slate-400 text-[10px]">{c.ore}h</span> : null}
                          {c?.note && (
                            <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-amber-400 rounded-full" />
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
                        isActive={activeCell === `${dip.id}-${d}-${n}`}
                        onToggle={(open) => onToggleCell(open ? `${dip.id}-${d}-${n}` : null)}
                        otherCausaliSum={otherCausaliSum}
                        daysInMonth={daysInMonth}
                      />
                    )
                  })}
                  {/* Summary Rows 3 and 4 individual */}
                  {n === 1 && (
                    <>
                      <td className="bg-amber-50 border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-amber-600 font-normal uppercase tracking-wider">Malat</span>
                        {totals.malattia}
                      </td>
                      <td className="bg-amber-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-amber-600 font-normal uppercase tracking-wider">Inf</span>
                        {totals.infortunio}
                      </td>
                      <td className="bg-amber-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-amber-600 font-normal uppercase tracking-wider">Mat</span>
                        {totals.maternita}
                      </td>
                      <td className="bg-amber-50 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-amber-600 font-normal uppercase tracking-wider">Allatt</span>
                        {totals.allattamento}
                      </td>
                    </>
                  )}
                  {n === 2 && (
                    <>
                      <td className="bg-slate-100 border-l-2 border-l-slate-400 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-slate-500 font-normal uppercase tracking-wider">Donaz</span>
                        {totals.donazione}
                      </td>
                      <td className="bg-slate-100 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-slate-500 font-normal uppercase tracking-wider">Perm</span>
                        {totals.permessi}
                      </td>
                      <td className="bg-slate-100 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-slate-500 font-normal uppercase tracking-wider">Caus</span>
                        {totals.altro}
                      </td>
                      <td className="bg-slate-100 border-l border-slate-200 px-1 py-2 text-center font-bold text-slate-900 text-sm min-w-[75px]">
                        <span className="block text-[8px] text-slate-500 font-normal uppercase tracking-wider">N.P.</span>
                        {totals.nonPagate}
                      </td>
                    </>
                  )}
                  {(n >= 3) && (
                    <td colSpan={4} className="border-l-2 border-l-slate-400 px-1 py-2"></td>
                  )}
                </tr>
              ))}

              {/* Turno — read only */}
              <tr className="bg-slate-50">
                <td className="sticky left-0 z-10 bg-slate-50 px-3 py-1.5 text-slate-500 border-r border-slate-200">
                  Turno
                </td>
                {days.map(d => (
                  <td key={d} className="border border-slate-100 px-0.5 py-1 text-center text-slate-500">
                    {getGiornata(d)?.turno || ''}
                  </td>
                ))}
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

// Main component
export default function FoglioPresenze({
  foglioId, azienda, sede, anno, mese, status, dipendenti: initialDipendenti, readOnly, onBack
}: FoglioPresenzaProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null)
  const [showLegenda, setShowLegenda] = useState(false)
  const [sending, startSend] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const daysInMonth = getDaysInMonth(anno, mese)
  
  // A foglio is read-only if explicitly passed as readOnly OR if status is already confermato/chiuso
  const isConfermato = readOnly || status === 'confermato' || status === 'chiuso'

  function handleConfirm() {
    if (!confirm(`Confermi l'invio del foglio presenze di ${MESI[mese]} ${anno}? Una volta inviato non sarà più modificabile.`)) return
    setError(null)
    startSend(() =>
      confirmAndSend(foglioId)
        .then(() => setSent(true))
        .catch(e => setError(e.message))
    )
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
              disabled={sending}
              className="flex items-center gap-2 rounded-xl bg-[#D32F2F] px-5 py-2 text-sm font-bold text-white hover:bg-[#b02727] disabled:opacity-50 shadow-lg shadow-red-900/10 transition-all"
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
        </div>
      )}

      {/* Legenda */}
      {showLegenda && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-bold text-amber-900 mb-2">Legenda Giustificativi</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
            {GIUSTIFICATIVI.map(g => (
              <div key={g.codice} className="text-xs text-amber-800">
                <span className="font-mono font-bold">{g.codice}</span> — {g.label}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-700">
            Clicca su una cella causale per modificarla.
          </p>
        </div>
      )}

      {/* Dipendenti */}
      {initialDipendenti.map(dip => (
        <DipendenteSection
          key={dip.id}
          dip={dip}
          daysInMonth={daysInMonth}
          foglioStatus={status}
          activeCell={activeCell}
          onToggleCell={setActiveCell}
        />
      ))}
    </div>
  )
}
