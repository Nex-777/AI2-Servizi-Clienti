"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { 
  getAllProvince, 
  getComuniUniqueByProvincia, 
  getCapsByComune 
} from "italian-cap-comuni-province";
import { MapPin, Info, CheckCircle, AlertTriangle, Route } from "lucide-react";

export interface AddressData {
  provincia: string;
  comune: string;
  cap: string;
  via: string;
  civico: string;
  distanza_km?: string | null;
}

interface AddressPickerProps {
  label?: string;
  type: 'sede' | 'cantiere' | 'committente';
  value?: Partial<AddressData>;
  onChange?: (fields: Partial<AddressData>) => void;
  fieldMapping?: {
    provincia?: string;
    comune?: string;
    cap?: string;
    via?: string;
    civico?: string;
    distanza_km?: string;
  };
  errors?: any;
  className?: string;
  showCalculationWarning?: boolean;
  sedeComune?: string; // Comune della sede principale per confronto
  sedeProvincia?: string; // Provincia della sede principale per confronto
}

export const AddressPicker: React.FC<AddressPickerProps> = ({ 
  label = "Indirizzo",
  type,
  value, 
  onChange, 
  fieldMapping,
  errors: manualErrors,
  className = "",
  showCalculationWarning = true,
  sedeComune,
  sedeProvincia
}) => {
  const formContext = useFormContext();
  const isHookForm = !!formContext && !value;
  const { watch, setValue, formState } = formContext || {};
  const hookErrors = formState?.errors || {};
  const currentErrors = isHookForm ? hookErrors : manualErrors || {};

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Valori correnti
  const watchVia = isHookForm ? watch?.(fieldMapping?.via || "via") : value?.via;
  const watchProv = isHookForm ? watch?.(fieldMapping?.provincia || "provincia") : value?.provincia;
  const watchComune = isHookForm ? watch?.(fieldMapping?.comune || "comune") : value?.comune;
  const watchDistanza = isHookForm ? watch?.(fieldMapping?.distanza_km || "distanza_km") : value?.distanza_km;

  const provinceList = useMemo(() => getAllProvince().sort((a, b) => a.nome.localeCompare(b.nome)), []);
  
  const comuni = useMemo(() => {
    if (!watchProv) return [];
    return getComuniUniqueByProvincia(watchProv).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [watchProv]);

  const caps = useMemo(() => {
    if (!watchComune) return [];
    const comuneObj = comuni.find(c => c.nome === watchComune);
    if (!comuneObj) return [];
    return getCapsByComune(comuneObj.codiceIstat);
  }, [watchComune, comuni]);

  const handleFieldChange = (field: keyof AddressData, newValue: any) => {
    if (isHookForm) {
      const fieldName = fieldMapping?.[field] || field;
      setValue?.(fieldName, newValue);
    } else {
      onChange?.({ ...value, [field]: newValue } as AddressData);
    }
  };

  const handleFieldsChange = (updates: Partial<AddressData>) => {
    if (isHookForm) {
      Object.entries(updates).forEach(([field, val]) => {
        const fieldName = fieldMapping?.[field as keyof AddressData] || field;
        setValue?.(fieldName, val);
      });
    } else {
      onChange?.({ ...value, ...updates } as AddressData);
    }
  };

  const getFieldError = (field: keyof AddressData) => {
    const fieldName = fieldMapping?.[field] || field;
    return currentErrors[fieldName];
  };

  const inputClass = (field: keyof AddressData) => `
    w-full px-4 py-3 rounded-xl border outline-none transition-all text-sm
    ${getFieldError(field) ? "border-red-500 bg-red-50/10" : "border-slate-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"}
    disabled:bg-slate-50 disabled:cursor-not-allowed
  `;

  // Logica confronto comuni e fasce KM (solo suggerimento iniziale)
  useEffect(() => {
    if (type === 'cantiere' && sedeComune && watchComune && !watchDistanza) {
      if (sedeComune.toUpperCase() === watchComune.toUpperCase()) {
        handleFieldChange('distanza_km', '0');
      }
    }
  }, [watchComune, sedeComune, type, watchDistanza]);

  const isSameComune = type === 'cantiere' && sedeComune && watchComune && sedeComune.toUpperCase() === watchComune.toUpperCase();

  return (
    <div className={`space-y-4 ${className}`} ref={wrapperRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
          {label}
        </label>
      )}

      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-4 space-y-1 relative">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Via *</label>
          <input 
            value={watchVia || ""} 
            onChange={(e) => handleFieldChange('via', e.target.value)} 
            className={inputClass("via")}
            placeholder="Inserisci la via..."
          />
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Civico *</label>
          <input 
            value={isHookForm ? watch?.(fieldMapping?.civico || "civico") : value?.civico || ""} 
            onChange={(e) => handleFieldChange('civico', e.target.value)}
            className={inputClass("civico")}
            placeholder="N°"
          />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Provincia *</label>
          <select 
            value={watchProv || ""} 
            onChange={(e) => {
              handleFieldsChange({
                provincia: e.target.value,
                comune: "",
                cap: ""
              });
            }}
            className={inputClass("provincia")}
          >
            <option value="">Seleziona...</option>
            {provinceList.map(p => (
              <option key={p.sigla} value={p.sigla}>{p.nome}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Comune *</label>
          <select 
            value={watchComune || ""} 
            onChange={(e) => {
              handleFieldsChange({
                comune: e.target.value,
                cap: ""
              });
            }}
            disabled={!watchProv}
            className={inputClass("comune")}
          >
            <option value="">Seleziona...</option>
            {comuni.map(c => (
              <option key={c.nome} value={c.nome}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">CAP *</label>
          <select 
            value={isHookForm ? watch?.(fieldMapping?.cap || "cap") : value?.cap || ""} 
            onChange={(e) => handleFieldChange('cap', e.target.value)}
            disabled={!watchComune}
            className={inputClass("cap")}
          >
            <option value="">Seleziona...</option>
            {caps.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* SEZIONE FASCE KM (Solo per Cantiere) */}
      {type === 'cantiere' && (
        <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
          <div className={`p-4 rounded-2xl border transition-all ${isSameComune ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isSameComune ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Route className="h-3.5 w-3.5" />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isSameComune ? 'text-emerald-700' : 'text-slate-500'}`}>
                  Fascia Chilometrica (Trasferta)
                </span>
              </div>
              {isSameComune && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-100/50 px-2 py-0.5 rounded-full">
                  STESSO COMUNE SEDE
                </span>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                {isSameComune 
                  ? "Il cantiere è nello stesso comune della sede. Seleziona '0' se la trasferta non è dovuta, oppure scegli una fascia se prevista:"
                  : "Il cantiere è in un comune diverso dalla sede. Seleziona la fascia di distanza dai confini comunali:"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "0",
                  "Fino a 10Km",
                  "Da 10Km a 20Km",
                  "Da 20Km a 30Km",
                  "Oltre 30Km"
                ].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => handleFieldChange('distanza_km', range)}
                    className={`
                      px-4 py-2.5 rounded-xl text-[10px] font-bold transition-all border
                      ${watchDistanza === range 
                        ? 'bg-[#D32F2F] border-[#D32F2F] text-white shadow-lg shadow-red-900/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}
                      ${range === '0' ? 'col-span-2' : ''}
                    `}
                  >
                    {range === '0' ? '0 (Nessuna Trasferta)' : range}
                  </button>
                ))}
              </div>
              {getFieldError('distanza_km') && (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Campo obbligatorio
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
