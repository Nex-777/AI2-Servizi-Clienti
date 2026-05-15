"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import { AddressPicker } from "@/components/common/AddressPicker";
import { createClientAccount } from "./actions";

export default function CreateClientForm() {
  const [address, setAddress] = useState({
    via: "",
    civico: "",
    comune: "",
    provincia: "",
    cap: ""
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sticky top-8">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-[#D32F2F]" />
        Nuovo Cliente
      </h2>
      <form action={createClientAccount} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Ragione Sociale</label>
          <input 
            name="ragione_sociale" 
            type="text" 
            required 
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
            placeholder="Es. Agenzia Italia 2 Srl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Codice 1 (User)</label>
          <input 
            name="codice1" 
            type="text" 
            required 
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
            placeholder="Es. mario_rossi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Codice 2 (Password/P.IVA)</label>
          <input 
            name="codice2" 
            type="text" 
            required 
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
            placeholder="Es. 01234567890"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Numero Ditta
            <span className="ml-1 text-xs text-slate-400">(per auto-detect CSV)</span>
          </label>
          <input 
            name="numero_ditta" 
            type="text" 
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none font-mono"
            placeholder="Es. 000099"
            maxLength={10}
          />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dati Sede (Obbligatori)</p>
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">N° Sede</label>
            <input 
              name="numero_sede" 
              type="text" 
              required 
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
              placeholder="Es. 1"
            />
          </div>

          <AddressPicker 
            type="sede"
            label="Sede Legale / Principale"
            value={address}
            onChange={(fields) => setAddress(prev => ({ ...prev, ...fields }))}
            className="mb-4"
          />

          {/* Hidden inputs per far arrivare i dati alla Server Action */}
          <input type="hidden" name="via" value={address.via} />
          <input type="hidden" name="civico" value={address.civico} />
          <input type="hidden" name="comune" value={address.comune} />
          <input type="hidden" name="provincia" value={address.provincia} />
          <input type="hidden" name="cap" value={address.cap} />
          
          {/* Manteniamo compatibilità con il vecchio campo 'indirizzo' se la Server Action lo usa ancora */}
          <input type="hidden" name="indirizzo" value={`${address.via} ${address.civico}`} />
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Impostazioni Avanzate</p>
          <div className="mb-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="is_edile" value="true" className="rounded border-slate-300 text-[#D32F2F] focus:ring-[#D32F2F]"/>
              <span className="text-sm font-medium text-slate-700">Ditta Edile</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Lettera Identificativa (es. Z)</label>
            <input 
              name="lettera_identificativa" 
              type="text" 
              maxLength={1}
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none uppercase"
              placeholder="Lascia vuoto se non edile"
            />
          </div>
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Data Santo Patrono (DD-MM)</label>
            <input 
              name="data_santo_patrono" 
              type="text" 
              className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#D32F2F] outline-none"
              placeholder="Es. 05-08 (Opzionale)"
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#b02727] transition-colors"
        >
          Crea Account
        </button>
      </form>
    </div>
  );
}
