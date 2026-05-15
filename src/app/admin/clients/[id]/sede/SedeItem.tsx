'use client'

import { useState, useTransition } from 'react'
import { MapPin, Pencil, Trash2, X, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { AddressPicker } from '@/components/common/AddressPicker'
import { updateAdditionalSede, deleteAdditionalSede } from '../../actions'

interface SedeItemProps {
  clientId: string
  sede: any
}

export default function SedeItem({ clientId, sede }: SedeItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [addressData, setAddressData] = useState({
    via: sede.indirizzo || '',
    comune: sede.comune || '',
    provincia: sede.provincia || '',
    cap: sede.cap || '',
    civico: sede.civico || '',
    is_verified: sede.is_verified || false,
  })
  const [numero, setNumero] = useState(sede.numero || '')
  const [dataSantoPatrono, setDataSantoPatrono] = useState(sede.data_santo_patrono || '')

  async function handleSave() {
    const formData = new FormData()
    formData.append('numero', numero)
    formData.append('indirizzo', addressData.via)
    formData.append('comune', addressData.comune)
    formData.append('provincia', addressData.provincia)
    formData.append('cap', addressData.cap)
    formData.append('civico', addressData.civico)
    formData.append('data_santo_patrono', dataSantoPatrono)

    startTransition(async () => {
      try {
        await updateAdditionalSede(clientId, sede.id, formData)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setIsEditing(false)
        }, 1500)
      } catch (error) {
        alert('Errore: ' + (error as Error).message)
      }
    })
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-3xl border-2 border-blue-100 p-6 shadow-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-blue-600" />
            Modifica Sede {numero}
          </h3>
          <button 
            onClick={() => setIsEditing(false)}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">N° Sede</label>
            <input 
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            />
          </div>

          <AddressPicker 
            type="sede"
            value={addressData}
            onChange={(fields) => setAddressData(prev => ({ ...prev, ...fields }))}
          />

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Data Santo Patrono (DD-MM)</label>
            <input 
              value={dataSantoPatrono}
              onChange={(e) => setDataSantoPatrono(e.target.value)}
              className="w-full max-w-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center" 
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              onClick={handleSave}
              disabled={isPending}
              className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
                isPending ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isPending ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
            {showSuccess && (
              <div className="absolute inset-0 bg-white/80 rounded-3xl flex items-center justify-center z-10 animate-in fade-in duration-300">
                <div className="flex flex-col items-center gap-2 text-green-600 font-bold">
                  <CheckCircle2 className="h-8 w-8" />
                  Sede aggiornata!
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex justify-between items-center group hover:border-blue-200 hover:shadow-md transition-all">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-bold group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
          {sede.numero}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 leading-tight">{sede.comune} ({sede.provincia})</h4>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 shrink-0" /> {sede.indirizzo}{sede.civico ? `, ${sede.civico}` : ''}
          </p>
          {sede.data_santo_patrono && (
            <p className="text-[10px] text-blue-600 font-medium mt-1">
              Santo Patrono: {sede.data_santo_patrono}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setIsEditing(true)}
          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
          title="Modifica"
        >
          <Pencil className="h-4.5 w-4.5" />
        </button>
        
        <form action={async () => {
          if (confirm('Sei sicuro di voler eliminare questa sede?')) {
            await deleteAdditionalSede(clientId, sede.id)
          }
        }}>
          <button 
            type="submit" 
            className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Elimina"
          >
            <Trash2 className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
