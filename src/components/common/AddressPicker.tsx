"use client";

import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { 
  getAllProvince, 
  getComuniUniqueByProvincia, 
  getCapsByComune 
} from "italian-cap-comuni-province";
import { MapPin } from "lucide-react";

export interface AddressData {
  provincia: string;
  comune: string;
  cap: string;
  via: string;
  civico: string;
}

interface AddressPickerProps {
  label?: string;
  // Per modalità manuale (DNL/useState)
  value?: Partial<AddressData>;
  onChange?: (fields: Partial<AddressData>) => void;
  // Per etichette personalizzate dei campi (es. 'prov' invece di 'provincia')
  fieldMapping?: {
    provincia?: string;
    comune?: string;
    cap?: string;
    via?: string;
    civico?: string;
  };
  errors?: any;
  className?: string;
}

export const AddressPicker: React.FC<AddressPickerProps> = ({ 
  label = "Indirizzo",
  value, 
  onChange, 
  fieldMapping,
  errors: manualErrors,
  className = "" 
}) => {
  // Tentiamo di recuperare il contesto del form se esiste
  const formContext = useFormContext();
  
  // Decidiamo se siamo in modalità react-hook-form o manuale
  const isHookForm = !!formContext && !value;
  
  // Se siamo in Hook Form, usiamo i suoi metodi, altrimenti usiamo i dati passati
  const { register, watch, setValue, formState } = formContext || {};
  const hookErrors = formState?.errors || {};
  const currentErrors = isHookForm ? hookErrors : manualErrors || {};

  // Valori correnti
  const watchProv = isHookForm ? watch?.(fieldMapping?.provincia || "provincia") : value?.provincia;
  const watchComune = isHookForm ? watch?.(fieldMapping?.comune || "comune") : value?.comune;

  // 1. Province (Statiche)
  const province = useMemo(() => {
    return getAllProvince().sort((a, b) => a.nome.localeCompare(b.nome));
  }, []);

  // 2. Comuni filtrati
  const comuni = useMemo(() => {
    if (!watchProv) return [];
    return getComuniUniqueByProvincia(watchProv).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [watchProv]);

  // 3. CAP filtrati
  const caps = useMemo(() => {
    if (!watchComune) return [];
    const comuneObj = comuni.find(c => c.nome === watchComune);
    if (!comuneObj) return [];
    return getCapsByComune(comuneObj.codiceIstat);
  }, [watchComune, comuni]);

  // Logica di aggiornamento campi
  const handleFieldChange = (field: keyof AddressData, newValue: string) => {
    if (isHookForm) {
      const fieldName = fieldMapping?.[field] || field;
      setValue?.(fieldName, newValue);
    } else {
      onChange?.({ [field]: newValue });
    }
  };

  // RESET LOGIC
  useEffect(() => {
    if (watchProv) {
      const isComuneValid = comuni.some(c => c.nome === watchComune);
      if (watchComune && !isComuneValid) {
        handleFieldChange("comune", "");
        handleFieldChange("cap", "");
      }
    }
  }, [watchProv, comuni]);

  // Auto-fill CAP se unico
  useEffect(() => {
    if (caps.length === 1 && caps[0] !== (isHookForm ? watch?.(fieldMapping?.cap || "cap") : value?.cap)) {
      handleFieldChange("cap", caps[0]);
    }
  }, [caps]);

  const getFieldError = (field: keyof AddressData) => {
    const fieldName = fieldMapping?.[field] || field;
    return currentErrors[fieldName];
  };

  const inputClass = (field: keyof AddressData) => `
    w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm
    ${getFieldError(field) ? "border-red-500 bg-red-50/10" : "border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"}
    disabled:bg-slate-50 disabled:cursor-not-allowed
  `;

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
          {label}
        </label>
      )}

      <div className="grid grid-cols-6 gap-4">
        {/* VIA */}
        <div className="col-span-4 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Via *</label>
          {isHookForm ? (
            <input {...register?.(fieldMapping?.via || "via")} className={inputClass("via")} />
          ) : (
            <input 
              value={value?.via || ""} 
              onChange={(e) => handleFieldChange("via", e.target.value)} 
              className={inputClass("via")}
            />
          )}
        </div>

        {/* CIVICO */}
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 text-center block">Civico *</label>
          {isHookForm ? (
            <input {...register?.(fieldMapping?.civico || "civico")} className={`${inputClass("civico")} text-center`} />
          ) : (
            <input 
              value={value?.civico || ""} 
              onChange={(e) => handleFieldChange("civico", e.target.value)} 
              className={`${inputClass("civico")} text-center`}
            />
          )}
        </div>

        {/* PROVINCIA */}
        <div className="col-span-1 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 text-center block">Prov *</label>
          <select 
            value={watchProv || ""}
            onChange={(e) => handleFieldChange("provincia", e.target.value)}
            className={`${inputClass("provincia")} text-center uppercase appearance-none`}
          >
            <option value=""></option>
            {province.map(p => <option key={p.sigla} value={p.sigla}>{p.sigla}</option>)}
          </select>
        </div>

        {/* COMUNE */}
        <div className="col-span-3 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Comune *</label>
          <select 
            value={watchComune || ""}
            disabled={!watchProv}
            onChange={(e) => handleFieldChange("comune", e.target.value)}
            className={inputClass("comune")}
          >
            <option value="">{watchProv ? "Scegli..." : "---"}</option>
            {comuni.map(c => <option key={c.codiceIstat} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>

        {/* CAP */}
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 text-center block">CAP *</label>
          <select 
            value={(isHookForm ? watch?.(fieldMapping?.cap || "cap") : value?.cap) || ""}
            disabled={!watchComune}
            onChange={(e) => handleFieldChange("cap", e.target.value)}
            className={`${inputClass("cap")} text-center`}
          >
            <option value="">{watchComune ? "..." : "---"}</option>
            {caps.map(cap => <option key={cap} value={cap}>{cap}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};
