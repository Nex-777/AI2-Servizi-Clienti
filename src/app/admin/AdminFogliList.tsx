'use client'

import { useState } from 'react'
import { ArrowRight, Users, Calendar, CheckCircle, Clock, AlertCircle, RotateCcw, XCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { reopenFoglio } from '@/app/actions/confirm'

const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

type Foglio = {
  id: string
  client_id: string
  azienda: string
  anno: number
  mese: number
  status: string
  admin_status?: string | null
  uploaded_at: string
  note?: string | null
  checkpoints?: { id: string, text: string, resolved: boolean }[] | null
  profiles?: { email: string, ragione_sociale?: string | null }
  dipendenti?: [{ count: number }] | { count: number } | any
}

export default function AdminFogliList({ fogli: initialFogli }: { fogli: Foglio[] }) {
  const [fogli, setFogli] = useState<Foglio[]>(initialFogli)
  const now = new Date()
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  const [filterMese, setFilterMese] = useState<string>(String(prevMonth))
  const [filterAnno, setFilterAnno] = useState<string>(String(defaultYear))
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [noteModal, setNoteModal] = useState<{ id: string, isOpen: boolean, checkpoints: { id: string, text: string, resolved: boolean }[], newText: string }>({ 
    id: '', 
    isOpen: false, 
    checkpoints: [],
    newText: '' 
  })
  const supabase = createClient()
  const router = useRouter()

  const years = Array.from(new Set(initialFogli.map(f => f.anno))).sort((a, b) => b - a)

  const filteredFogli = fogli
    .filter(f => {
      const matchMese = filterMese === '' || String(f.mese) === filterMese
      const matchAnno = filterAnno === '' || String(f.anno) === filterAnno
      const matchStatus = filterStatus === '' || (f.admin_status || 'da_fare') === filterStatus
      const isNotBozza = f.status !== 'bozza'
      return matchMese && matchAnno && matchStatus && isNotBozza
    })
    .sort((a, b) => {
      const statusPriority: Record<string, number> = { 'da_fare': 1, 'sospeso': 2, 'chiuso': 3 }
      const priorityA = statusPriority[a.admin_status || 'da_fare'] || 1
      const priorityB = statusPriority[b.admin_status || 'da_fare'] || 1
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }
      
      const dateA = new Date(a.uploaded_at).getTime()
      const dateB = new Date(b.uploaded_at).getTime()
      
      if (sortOrder === 'desc') return dateB - dateA
      return dateA - dateB
    })

  const getDipendentiCount = (dipendenti: any) => {
    if (!dipendenti) return 0
    if (Array.isArray(dipendenti)) return dipendenti[0]?.count || 0
    return dipendenti.count || 0
  }

  const updateAdminStatus = async (id: string, newStatus: string, checkpoints?: any[]) => {
    setIsUpdating(id)
    try {
      const updateData: any = { admin_status: newStatus }
      if (checkpoints !== undefined) updateData.checkpoints = checkpoints

      const { error } = await supabase
        .from('fogli_presenza')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Error updating status:', error)
        alert('Errore durante l\'aggiornamento dello stato.')
      } else {
        setFogli(prev => prev.map(f => f.id === id ? { ...f, admin_status: newStatus, checkpoints: checkpoints !== undefined ? checkpoints : f.checkpoints } : f))
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdating(null)
      setNoteModal({ id: '', isOpen: false, checkpoints: [], newText: '' })
    }
  }

  const handleStatusChange = (id: string, newStatus: string, currentCheckpoints?: any[] | null) => {
    if (newStatus === 'sospeso') {
      setNoteModal({ 
        id, 
        isOpen: true, 
        checkpoints: currentCheckpoints || [], 
        newText: '' 
      })
    } else {
      updateAdminStatus(id, newStatus)
    }
  }

  const toggleCheckpoint = async (foglioId: string, checkpointId: string) => {
    const foglio = fogli.find(f => f.id === foglioId)
    if (!foglio) return
    
    const newCheckpoints = (foglio.checkpoints || []).map(cp => 
      cp.id === checkpointId ? { ...cp, resolved: !cp.resolved } : cp
    )
    
    await updateAdminStatus(foglioId, foglio.admin_status || 'sospeso', newCheckpoints)
  }

  const getStatusBadge = (status: string | null | undefined, id: string) => {
    const s = status || 'da_fare'
    if (s === 'chiuso') {
      return (
        <select 
          value={s}
          onChange={(e) => handleStatusChange(id, e.target.value)}
          disabled={isUpdating === id}
          className="bg-emerald-50 text-emerald-700 border-none text-xs font-bold rounded-full px-3 py-1.5 cursor-pointer outline-none appearance-none pr-8"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23047857%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
        >
          <option value="da_fare">Da Fare</option>
          <option value="sospeso">Sospeso</option>
          <option value="chiuso">Chiuso</option>
        </select>
      )
    }
    if (s === 'sospeso') {
      return (
        <select 
          value={s}
          onChange={(e) => handleStatusChange(id, e.target.value, fogli.find(f => f.id === id)?.checkpoints)}
          disabled={isUpdating === id}
          className="bg-red-50 text-red-700 border-none text-xs font-bold rounded-full px-3 py-1.5 cursor-pointer outline-none appearance-none pr-8"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b91c1c%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
        >
          <option value="da_fare">Da Fare</option>
          <option value="sospeso">Sospeso</option>
          <option value="chiuso">Chiuso</option>
        </select>
      )
    }
    return (
      <select 
        value={s}
        onChange={(e) => handleStatusChange(id, e.target.value)}
        disabled={isUpdating === id}
        className="bg-amber-50 text-amber-700 border-none text-xs font-bold rounded-full px-3 py-1.5 cursor-pointer outline-none appearance-none pr-8"
        style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23b45309%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto' }}
      >
        <option value="da_fare">Da Fare</option>
        <option value="sospeso">Sospeso</option>
        <option value="chiuso">Chiuso</option>
      </select>
    )
  }

  const stats = {
    total: {
      fogli: filteredFogli.length,
      dipendenti: filteredFogli.reduce((acc, f) => acc + getDipendentiCount(f.dipendenti), 0)
    },
    daFare: {
      fogli: filteredFogli.filter(f => !f.admin_status || f.admin_status === 'da_fare').length,
      dipendenti: filteredFogli.filter(f => !f.admin_status || f.admin_status === 'da_fare').reduce((acc, f) => acc + getDipendentiCount(f.dipendenti), 0)
    },
    sospesi: {
      fogli: filteredFogli.filter(f => f.admin_status === 'sospeso').length,
      dipendenti: filteredFogli.filter(f => f.admin_status === 'sospeso').reduce((acc, f) => acc + getDipendentiCount(f.dipendenti), 0)
    },
    chiusi: {
      fogli: filteredFogli.filter(f => f.admin_status === 'chiuso').length,
      dipendenti: filteredFogli.filter(f => f.admin_status === 'chiuso').reduce((acc, f) => acc + getDipendentiCount(f.dipendenti), 0)
    }
  }

  const StatCard = ({ icon, label, fogli, dipendenti, colorClass, bgColorClass }: { icon: any, label: string, fogli: number, dipendenti: number, colorClass: string, bgColorClass: string }) => (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group flex items-center gap-4">
      <div className={`p-2 ${bgColorClass} ${colorClass} rounded-lg transition-transform group-hover:scale-110 duration-200 shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</span>
        <div className="flex items-baseline gap-3">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 leading-none">{fogli}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Segnaore</span>
          </div>
          <div className="flex items-baseline gap-1 border-l border-slate-100 pl-3">
            <span className="text-sm font-bold text-slate-600 leading-none">{dipendenti}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Dip.</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="mt-4">
      {/* Riepilogo Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard 
          icon={<Calendar className="h-5 w-5" />} 
          label="Totali" 
          fogli={stats.total.fogli} 
          dipendenti={stats.total.dipendenti}
          colorClass="text-slate-600"
          bgColorClass="bg-slate-50"
        />
        <StatCard 
          icon={<Clock className="h-5 w-5" />} 
          label="Da Fare" 
          fogli={stats.daFare.fogli} 
          dipendenti={stats.daFare.dipendenti}
          colorClass="text-amber-600"
          bgColorClass="bg-amber-50"
        />
        <StatCard 
          icon={<AlertCircle className="h-5 w-5" />} 
          label="Sospesi" 
          fogli={stats.sospesi.fogli} 
          dipendenti={stats.sospesi.dipendenti}
          colorClass="text-red-600"
          bgColorClass="bg-red-50"
        />
        <StatCard 
          icon={<CheckCircle className="h-5 w-5" />} 
          label="Chiusi" 
          fogli={stats.chiusi.fogli} 
          dipendenti={stats.chiusi.dipendenti}
          colorClass="text-emerald-600"
          bgColorClass="bg-emerald-50"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-xl font-bold text-slate-900">Segnaore Inviati dai Clienti</h2>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-2 border-r border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtra:</span>
          </div>
          <select 
            value={filterMese}
            onChange={(e) => setFilterMese(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            <option value="">Tutti i mesi</option>
            {MESI.map((m, i) => m ? <option key={i} value={i}>{m}</option> : null)}
          </select>
          <div className="w-px h-4 bg-slate-200"></div>
          <select 
            value={filterAnno}
            onChange={(e) => setFilterAnno(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            <option value="">Tutti gli anni</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="w-px h-4 bg-slate-200"></div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-transparent border-none focus:ring-0 cursor-pointer"
          >
            <option value="">Tutti gli stati</option>
            <option value="da_fare">Da Fare</option>
            <option value="sospeso">Sospesi</option>
            <option value="chiuso">Chiusi</option>
          </select>
          <div className="w-px h-4 bg-slate-200"></div>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 hover:text-[#D32F2F] transition-colors"
            title={sortOrder === 'desc' ? 'Dal più recente' : 'Dal più vecchio'}
          >
            {sortOrder === 'desc' ? 'Recenti ↓' : 'Vecchi ↑'}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {filteredFogli.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
             <AlertCircle className="h-8 w-8 text-slate-300 mb-2" />
             <p className="text-sm font-medium text-slate-500">Nessun segnaore trovato per i filtri selezionati.</p>
             <button 
                onClick={() => { setFilterMese(''); setFilterAnno(''); }}
                className="mt-4 text-xs font-bold text-[#D32F2F] hover:underline"
              >
                Resetta filtri
              </button>
          </div>
        ) : filteredFogli.map((f) => {
          const dipCount = getDipendentiCount(f.dipendenti)
          const meseNome = MESI[f.mese] || `Mese ${f.mese}`
          
          return (
            <div key={f.id} className="group relative flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-lg">{f.profiles?.ragione_sociale || f.azienda}</span>
                  <span className="text-xs text-slate-500">{f.profiles?.email || 'Nessuna email'}</span>
                  {f.checkpoints && f.checkpoints.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5 max-w-md">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punti di Controllo:</p>
                        <button 
                          onClick={() => handleStatusChange(f.id, 'sospeso', f.checkpoints)}
                          className="text-[10px] font-bold text-[#D32F2F] hover:underline"
                        >
                          Modifica
                        </button>
                      </div>
                      {f.checkpoints.map(cp => (
                        <div 
                          key={cp.id} 
                          onClick={() => toggleCheckpoint(f.id, cp.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                            cp.resolved 
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                              : 'bg-red-50 border-red-100 text-red-700'
                          }`}
                        >
                          <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center transition-colors ${
                            cp.resolved ? 'bg-emerald-500 border-emerald-600' : 'bg-white border-red-300'
                          }`}>
                            {cp.resolved && <CheckCircle className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <span className={`text-xs font-medium ${cp.resolved ? 'line-through opacity-70' : ''}`}>
                            {cp.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
                
                <div className="flex items-center gap-2 text-slate-600 hidden sm:flex">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">{meseNome} {f.anno}</span>
                </div>
                
                <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

                <div className="flex items-center gap-2 text-slate-600 hidden md:flex">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">{dipCount} dipendenti</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {getStatusBadge(f.admin_status, f.id)}
                
                <Link
                  href={`/?impersonate=${f.client_id}&id=${f.id}`}
                  className="flex items-center justify-center h-9 w-9 rounded-lg bg-slate-50 text-slate-600 hover:bg-[#D32F2F] hover:text-white transition-colors"
                  title="Visiona Segnaore come Admin"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {(f.status === 'confermato' || f.status === 'chiuso') && (
                  <button
                    onClick={async () => {
                      if (confirm("Vuoi davvero riaprire questo segnaore? Tornerà in stato 'Bozza' e il cliente potrà modificarlo.")) {
                        setIsUpdating(f.id)
                        try {
                          console.log('Calling reopenFoglio for:', f.id)
                          const res = await reopenFoglio(f.id)
                          if (res?.success) {
                            console.log('Reopen success, updating local state')
                            setFogli(prev => prev.filter(item => item.id !== f.id))
                            router.refresh()
                          }
                        } catch (e: any) {
                          alert(e.message)
                        } finally {
                          setIsUpdating(null)
                        }
                      }
                    }}
                    className="flex items-center justify-center h-9 w-9 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                    title="Riapri Segnaore (Torna in Bozza)"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Checklist Anomalie */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="text-lg font-bold">Gestione Anomalie</h3>
                </div>
                <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                  {noteModal.checkpoints.length} Punti
                </span>
              </div>
              <p className="text-xs text-red-600 mt-1">Aggiungi o segna come risolte le problematiche del segnaore.</p>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="flex flex-col gap-3">
                {noteModal.checkpoints.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm text-slate-400">Nessuna anomalia inserita.</p>
                  </div>
                )}
                
                {noteModal.checkpoints.map((cp, idx) => (
                  <div key={cp.id} className="flex items-center gap-3 group">
                    <input 
                      type="checkbox"
                      checked={cp.resolved}
                      onChange={() => {
                        const newCP = [...noteModal.checkpoints]
                        newCP[idx].resolved = !newCP[idx].resolved
                        setNoteModal(prev => ({ ...prev, checkpoints: newCP }))
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-[#D32F2F] focus:ring-[#D32F2F]"
                    />
                    <input 
                      type="text"
                      value={cp.text}
                      onChange={(e) => {
                        const newCP = [...noteModal.checkpoints]
                        newCP[idx].text = e.target.value
                        setNoteModal(prev => ({ ...prev, checkpoints: newCP }))
                      }}
                      className={`flex-1 text-sm p-2 rounded-lg border-transparent hover:border-slate-200 focus:border-[#D32F2F] bg-transparent outline-none transition-all ${cp.resolved ? 'line-through text-slate-400' : 'text-slate-700'}`}
                    />
                    <button 
                      onClick={() => {
                        const newCP = noteModal.checkpoints.filter((_, i) => i !== idx)
                        setNoteModal(prev => ({ ...prev, checkpoints: newCP }))
                      }}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-all"
                      title="Rimuovi"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={noteModal.newText}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && noteModal.newText.trim()) {
                        const newItem = { id: Math.random().toString(36).substr(2, 9), text: noteModal.newText.trim(), resolved: false }
                        setNoteModal(prev => ({ ...prev, checkpoints: [...prev.checkpoints, newItem], newText: '' }))
                      }
                    }}
                    onChange={(e) => setNoteModal(prev => ({ ...prev, newText: e.target.value }))}
                    placeholder="Aggiungi una nuova anomalia..."
                    className="flex-1 text-sm p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#D32F2F] outline-none"
                  />
                  <button 
                    disabled={!noteModal.newText.trim()}
                    onClick={() => {
                      const newItem = { id: Math.random().toString(36).substr(2, 9), text: noteModal.newText.trim(), resolved: false }
                      setNoteModal(prev => ({ ...prev, checkpoints: [...prev.checkpoints, newItem], newText: '' }))
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => setNoteModal({ id: '', isOpen: false, checkpoints: [], newText: '' })}
                className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200"
              >
                Annulla
              </button>
              <button
                disabled={isUpdating === noteModal.id}
                onClick={() => updateAdminStatus(noteModal.id, 'sospeso', noteModal.checkpoints)}
                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 rounded-xl shadow-md transition-all"
              >
                {isUpdating === noteModal.id ? 'Salvataggio...' : 'Aggiorna Sospensione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
