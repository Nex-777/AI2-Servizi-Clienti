'use client'

import { useState } from 'react'
import { ArrowRight, Users, Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

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
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const years = Array.from(new Set(initialFogli.map(f => f.anno))).sort((a, b) => b - a)

  const filteredFogli = fogli.filter(f => {
    const matchMese = filterMese === '' || String(f.mese) === filterMese
    const matchAnno = filterAnno === '' || String(f.anno) === filterAnno
    return matchMese && matchAnno
  })

  const getDipendentiCount = (dipendenti: any) => {
    if (!dipendenti) return 0
    if (Array.isArray(dipendenti)) return dipendenti[0]?.count || 0
    return dipendenti.count || 0
  }

  const updateAdminStatus = async (id: string, newStatus: string) => {
    setIsUpdating(id)
    try {
      const { error } = await supabase
        .from('fogli_presenza')
        .update({ admin_status: newStatus })
        .eq('id', id)

      if (error) {
        console.error('Error updating status:', error)
        alert('Errore durante l\'aggiornamento dello stato.')
      } else {
        setFogli(fogli.map(f => f.id === id ? { ...f, admin_status: newStatus } : f))
        router.refresh()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusBadge = (status: string | null | undefined, id: string) => {
    const s = status || 'da_fare'
    if (s === 'chiuso') {
      return (
        <select 
          value={s}
          onChange={(e) => updateAdminStatus(id, e.target.value)}
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
          onChange={(e) => updateAdminStatus(id, e.target.value)}
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
        onChange={(e) => updateAdminStatus(id, e.target.value)}
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
    total: filteredFogli.length,
    daFare: filteredFogli.filter(f => !f.admin_status || f.admin_status === 'da_fare').length,
    sospesi: filteredFogli.filter(f => f.admin_status === 'sospeso').length,
    chiusi: filteredFogli.filter(f => f.admin_status === 'chiuso').length,
    dipendenti: filteredFogli.reduce((acc, f) => acc + getDipendentiCount(f.dipendenti), 0)
  }

  return (
    <div className="mt-12">
      {/* Riepilogo Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg"><Calendar className="h-4 w-4" /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Totali</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><Clock className="h-4 w-4" /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Da Fare</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.daFare}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="h-4 w-4" /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sospesi</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.sospesi}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle className="h-4 w-4" /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chiusi</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.chiusi}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="h-4 w-4" /></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dipendenti</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.dipendenti}</p>
        </div>
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
