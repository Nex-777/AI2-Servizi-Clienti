'use client'

import { useState, useTransition } from 'react'
import { Plus } from 'lucide-react'
import { AddressPicker } from '@/components/common/AddressPicker'
import { addAdditionalSede } from '../../actions'

interface AddSedeFormProps {
  clientId: string
}

export default function AddSedeForm({ clientId }: AddSedeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [addressData, setAddressData] = useState({
    via: '',
    comune: '',
    provincia: '',
    cap: '',
    civico: ''
  })
  const [numero, setNumero] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('numero', numero)
    formData.append('indirizzo', addressData.via)
    formData.append('comune', addressData.comune)
    formData.append('provincia', addressData.provincia)
    formData.append('cap', addressData.cap)

    startTransition(async () => {
      try {
        await addAdditionalSede(clientId, formData)
        // Reset form
        setNumero('')
        setAddressData({
          via: '',
          comune: '',
          provincia: '',
          cap: '',
          civico: ''
        })
      } catch (error) {
        alert('Errore: ' + (error as Error).message)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">N° Sede</label>
        <input 
          name="numero" 
          type="text" 
          required
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Es. 2"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
        />
      </div>

      <AddressPicker 
        type="sede"
        label="Indirizzo Nuova Sede"
        value={addressData}
        onChange={(fields) => setAddressData(prev => ({ ...prev, ...fields }))}
      />

      <button 
        type="submit" 
        disabled={isPending}
        className={`w-full py-3 rounded-xl text-white text-sm font-bold transition-all shadow-md active:scale-95 ${
          isPending ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isPending ? 'Aggiunta in corso...' : 'Aggiungi Sede Operativa'}
      </button>
    </form>
  )
}
