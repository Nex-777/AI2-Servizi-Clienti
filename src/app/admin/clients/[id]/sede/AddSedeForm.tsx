'use client'

import { useState, useTransition, useEffect } from 'react'
import { Plus, X, Loader2 } from 'lucide-react'
import { AddressPicker } from '@/components/common/AddressPicker'
import { addAdditionalSede } from '../../actions'

interface AddSedeFormProps {
  clientId: string
  nextNumero: number
}

export default function AddSedeForm({ clientId, nextNumero }: AddSedeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [addressData, setAddressData] = useState({
    via: '',
    comune: '',
    provincia: '',
    cap: '',
    civico: '',
    is_verified: false,
    lat: null as number | null,
    lon: null as number | null
  })
  const [numero, setNumero] = useState(nextNumero.toString())
  const [dataSantoPatrono, setDataSantoPatrono] = useState('')

  // Sincronizza numero quando nextNumero cambia
  useEffect(() => {
    setNumero(nextNumero.toString())
  }, [nextNumero])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('numero', numero)
    formData.append('indirizzo', addressData.via)
    formData.append('comune', addressData.comune)
    formData.append('provincia', addressData.provincia)
    formData.append('cap', addressData.cap)
    formData.append('civico', addressData.civico)
    formData.append('data_santo_patrono', dataSantoPatrono)
    formData.append('lat', addressData.lat?.toString() || '')
    formData.append('lon', addressData.lon?.toString() || '')
    formData.append('is_verified', addressData.is_verified ? 'true' : 'false')

    startTransition(async () => {
      try {
        await addAdditionalSede(clientId, formData)
        // Reset form and close
        setNumero((nextNumero + 1).toString())
        setDataSantoPatrono('')
        setAddressData({
          via: '',
          comune: '',
          provincia: '',
          cap: '',
          civico: '',
          is_verified: false,
          lat: null,
          lon: null
        })
        setIsOpen(false)
      } catch (error) {
        alert('Errore: ' + (error as Error).message)
      }
    })
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex flex-col items-center gap-2 group"
      >
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
          <Plus className="h-6 w-6" />
        </div>
        Aggiungi Sede Operativa {nextNumero}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-fit animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold flex items-center gap-2 border-b border-slate-50 pb-4">
          <Plus className="h-5 w-5 text-blue-600" />
          Nuova Sede Operativa
        </h2>
        <button 
          onClick={() => setIsOpen(false)}
          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">N° Sede</label>
          <input 
            name="numero" 
            type="text" 
            required
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder={`Es. ${nextNumero}`}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
          />
        </div>

        <AddressPicker 
          type="sede"
          label="Indirizzo Nuova Sede"
          value={addressData}
          onChange={(fields) => setAddressData(prev => ({ ...prev, ...fields }))}
        />

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Data Santo Patrono (DD-MM)</label>
          <input 
            name="data_santo_patrono" 
            type="text" 
            value={dataSantoPatrono}
            onChange={(e) => setDataSantoPatrono(e.target.value)}
            placeholder="Es. 05-08"
            className="w-full max-w-[120px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all text-center" 
          />
          <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">Lascia vuoto per rilevazione automatica da comune</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Annulla
          </button>
          <button 
            type="submit" 
            disabled={isPending}
            className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 ${
              isPending ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Aggiunta in corso...' : 'Aggiungi Sede Operativa'}
          </button>
        </div>
      </form>
    </div>
  )
}
