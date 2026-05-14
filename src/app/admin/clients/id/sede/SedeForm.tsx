'use client'

import { useState, useTransition } from 'react'
import { Save, CheckCircle2, Loader2 } from 'lucide-react'
import { updateClientProfile } from '../../actions'
import { AddressPicker } from '@/components/common/AddressPicker'

interface SedeFormProps {
  id: string
  client: any
}

export default function SedeForm({ id, client }: SedeFormProps) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)
  const [addressData, setAddressData] = useState({
    via: client.indirizzo || '',
    comune: client.comune || '',
    provincia: client.provincia || '',
    cap: client.cap || '',
    civico: client.civico || ''
  })

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setShowSuccess(false)
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      try {
        await updateClientProfile(id, formData)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } catch (error) {
        alert('Errore durante il salvataggio: ' + (error as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">N° Ditta (CSV Auto-detect)</label>
          <input 
            name="numero_ditta" 
            type="text" 
            defaultValue={client.numero_ditta || ''}
            placeholder="Es. 000099"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/10" 
          />
      </div>
      <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">N° Sede</label>
          <input 
            name="numero_sede" 
            type="text" 
            defaultValue={client.numero_sede || '1'}
            required
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-slate-50/30" 
          />
      </div>
      <AddressPicker 
        type="sede"
        label="Indirizzo Sede Principale"
        value={addressData}
        onChange={(fields) => setAddressData(prev => ({ ...prev, ...fields }))}
      />

      {/* Hidden fields since we use standard form action */}
      <input type="hidden" name="indirizzo" value={addressData.via} />
      <input type="hidden" name="civico" value={addressData.civico} />
      <input type="hidden" name="comune" value={addressData.comune} />
      <input type="hidden" name="provincia" value={addressData.provincia} />
      <input type="hidden" name="cap" value={addressData.cap} />

      <div className="pt-4 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 mb-4">Impostazioni Avanzate Cliente</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              name="is_edile" 
              value="true" 
              defaultChecked={client.is_edile}
              className="rounded border-slate-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-slate-700">Il cliente è una Ditta Edile?</span>
          </label>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lettera Identificativa (es. Z)</label>
            <input 
              name="lettera_identificativa" 
              type="text" 
              defaultValue={client.lettera_identificativa || ''}
              maxLength={1}
              className="w-full max-w-[120px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase text-center" 
              placeholder="Es: Z"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <button 
          type="submit"
          disabled={isPending}
          className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 ${
            isPending ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvataggio in corso...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salva Anagrafica
            </>
          )}
        </button>

        {showSuccess && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm animate-in fade-in slide-in-from-top-1 duration-300">
            <CheckCircle2 className="h-4 w-4" />
            Salvataggio completato con successo!
          </div>
        )}
      </div>
    </form>
  )
}
