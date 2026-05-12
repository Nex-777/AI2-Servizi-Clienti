"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { 
  getAllProvince, 
  getComuniUniqueByProvincia, 
  getCapsByComune 
} from "italian-cap-comuni-province";
import { MapPin, Search, Loader2, X, Calculator, CheckCircle, AlertTriangle } from "lucide-react";
import { useORSAutocomplete, ORSSuggestion } from "@/hooks/useORSAutocomplete";
import { Route, Info } from "lucide-react";

export interface AddressData {
  provincia: string;
  comune: string;
  cap: string;
  via: string;
  civico: string;
  is_verified: boolean;
  lat?: number | null;
  lon?: number | null;
  manual_km?: number | null;
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
    is_verified?: string;
    lat?: string;
    lon?: string;
    manual_km?: string;
  };
  errors?: any;
  className?: string;
  showCalculationWarning?: boolean;
}

// Utility potenziata per mappare i dati Photon alla sigla provincia GIS
const getSiglaProvincia = (photonState: string): string => {
  if (!photonState) return "";
  
  let cleanState = photonState
    .replace(/^provincia (di|delle|della) /i, "")
    .replace(/^città metropolitana di /i, "")
    .replace(/^libero consorzio comunale di /i, "")
    .trim();

  const provinces = getAllProvince();
  
  // 1. Cerca per nome esatto (case insensitive)
  let found = provinces.find(p => 
    p.nome.toLowerCase() === cleanState.toLowerCase() ||
    p.nome.toLowerCase().replace("-", " ") === cleanState.toLowerCase().replace("-", " ")
  );

  // 2. Cerca per inclusione
  if (!found) {
    found = provinces.find(p => {
      const pNome = p.nome.toLowerCase().replace("-", " ");
      const cState = cleanState.toLowerCase().replace("-", " ");
      return cState.includes(pNome) || pNome.includes(cState);
    });
  }
  
  // 3. Fallback se è già una sigla di 2 lettere
  if (!found && cleanState.length === 2) {
    const siglaUpper = cleanState.toUpperCase();
    if (provinces.some(p => p.sigla === siglaUpper)) return siglaUpper;
  }
  
  // 4. Casi specifici frequenti (Hardcoded for reliability)
  const sUpper = cleanState.toUpperCase();
  if (sUpper.includes("ASCOLI") || sUpper.includes("PICENO") || sUpper === "AP") return "AP";
  if (sUpper.includes("FERMO") || sUpper === "FM") return "FM";
  if (sUpper.includes("MACERATA") || sUpper === "MC") return "MC";
  if (sUpper.includes("ANCONA") || sUpper === "AN") return "AN";
  if (sUpper.includes("PESARO") || sUpper === "PU") return "PU";
  if (sUpper.includes("TERAMO") || sUpper === "TE") return "TE";

  return found ? found.sigla : "";
};

export const AddressPicker: React.FC<AddressPickerProps> = ({ 
  label = "Indirizzo",
  type,
  value, 
  onChange, 
  fieldMapping,
  errors: manualErrors,
  className = "",
  showCalculationWarning = true
}) => {
  const formContext = useFormContext();
  const isHookForm = !!formContext && !value;
  const { register, watch, setValue, formState } = formContext || {};
  const hookErrors = formState?.errors || {};
  const currentErrors = isHookForm ? hookErrors : manualErrors || {};

  // States per Autocomplete
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileSearch, setIsMobileSearch] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Valori correnti
  const watchVia = isHookForm ? watch?.(fieldMapping?.via || "via") : value?.via;
  const watchProv = isHookForm ? watch?.(fieldMapping?.provincia || "provincia") : value?.provincia;
  const watchComune = isHookForm ? watch?.(fieldMapping?.comune || "comune") : value?.comune;
  const isVerified = isHookForm ? watch?.(fieldMapping?.is_verified || "is_verified") : value?.is_verified;

  // ORS Hook
  const { suggestions, loading } = useORSAutocomplete(watchVia || "", watchComune, watchProv);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      onChange?.({ [field]: newValue });
    }
  };

  const handleFieldsChange = (updates: Partial<AddressData>) => {
    if (isHookForm) {
      Object.entries(updates).forEach(([field, val]) => {
        const fieldName = fieldMapping?.[field as keyof AddressData] || field;
        setValue?.(fieldName, val);
      });
    } else {
      onChange?.(updates);
    }
  };

  const handleSelectSuggestion = (s: ORSSuggestion) => {
    const sigla = getSiglaProvincia(s.state);
    
    handleFieldsChange({
      via: s.street || "",
      civico: s.housenumber || "",
      comune: s.city || "",
      provincia: sigla,
      cap: s.postcode || "",
      is_verified: true,
      lat: s.lat,
      lon: s.lon
    });
    
    setIsManual(false);
    setShowSuggestions(false);
    setIsMobileSearch(false);
  };

  const handleViaInputChange = (val: string) => {
    handleFieldsChange({
      via: val,
      is_verified: false,
      lat: null,
      lon: null,
      manual_km: null
    });
    setShowSuggestions(true);
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

  return (
    <div className={`space-y-4 ${className}`} ref={wrapperRef}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 block">
          {label}
        </label>
      )}

      <div className="grid grid-cols-6 gap-4">
        {/* VIA CON AUTOCOMPLETE E FEEDBACK STITCH */}
        <div className="col-span-4 space-y-1 relative">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 flex justify-between items-center">
            Via *
            {loading && <Loader2 className="h-2.5 w-2.5 animate-spin text-indigo-500" />}
          </label>
          <div className="relative">
            <input 
              value={watchVia || ""} 
              autoComplete="off"
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => handleViaInputChange(e.target.value)} 
              className={`${inputClass("via")} pr-10`}
              placeholder="Inizia a digitare l'indirizzo..."
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isVerified ? (
                <CheckCircle className="h-4 w-4 text-indigo-600 animate-in zoom-in" />
              ) : watchVia && watchVia.length > 3 ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 animate-pulse" />
              ) : (
                <Search className="h-4 w-4 text-slate-300" />
              )}
            </div>
          </div>

          {/* ALERT CALCOLO KM (Solo Cantiere) */}
          {type === 'cantiere' && !isVerified && watchVia && watchVia.length > 3 && showCalculationWarning && (
            <div className="mt-2 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-in fade-in slide-in-from-top-1 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Calculator className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase text-amber-700 tracking-tight">Distanza non calcolabile</p>
                  <p className="text-[10px] text-amber-600/80 leading-tight">L'indirizzo non è nel database GIS. Puoi inserire i KM stimati dalla sede oppure le coordinate GPS.</p>
                </div>
              </div>
              
              <div className="relative">
                <input 
                  type="number"
                  step="0.1"
                  placeholder="Esempio: 15.5"
                  value={isHookForm ? watch?.(fieldMapping?.manual_km || "manual_km") : (value?.manual_km || "")}
                  onChange={(e) => handleFieldChange("manual_km", e.target.value ? parseFloat(e.target.value) : null)}
                  className="w-full bg-white px-4 py-3 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-bold text-amber-900 pr-12"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-400">KM</div>
              </div>
            </div>
          )}

          {/* BOX COORDINATE (Per Sede e Cantiere) */}
          {type !== 'committente' && !isVerified && watchVia && watchVia.length > 3 && (
            <div className="mt-2 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-1 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-indigo-100 rounded-xl">
                  <Info className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase text-indigo-700 tracking-tight">Coordinate GPS {type === 'cantiere' ? '(Opzionali)' : ''}</p>
                  <p className="text-[10px] text-indigo-600/80 leading-tight">
                    {type === 'cantiere' 
                      ? "In alternativa ai KM, inserisci le coordinate da Google Maps." 
                      : "Indirizzo non trovato. Inserisci le coordinate da Google Maps per permettere il calcolo dei KM futuri."}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="relative">
                  <input 
                    type="number"
                    step="0.000001"
                    placeholder="Latitudine (es. 42.85)"
                    value={isHookForm ? watch?.(fieldMapping?.lat || "lat") : (value?.lat || "")}
                    onChange={(e) => handleFieldChange("lat", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full bg-white px-4 py-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-indigo-900"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-indigo-300 uppercase">Lat</div>
                </div>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.000001"
                    placeholder="Longitudine (es. 13.57)"
                    value={isHookForm ? watch?.(fieldMapping?.lon || "lon") : (value?.lon || "")}
                    onChange={(e) => handleFieldChange("lon", e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full bg-white px-4 py-3 rounded-xl border border-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-bold text-indigo-900"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-indigo-300 uppercase">Lon</div>
                </div>
              </div>

              {((isHookForm ? watch?.(fieldMapping?.lat || "lat") : value?.lat) && 
                (isHookForm ? watch?.(fieldMapping?.lon || "lon") : value?.lon)) && (
                <a 
                  href={`https://www.google.com/maps?q=${isHookForm ? watch?.(fieldMapping?.lat || "lat") : value?.lat},${isHookForm ? watch?.(fieldMapping?.lon || "lon") : value?.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg transition-all shadow-sm"
                >
                  <MapPin className="h-3 w-3" />
                  VERIFICA POSIZIONE SU GOOGLE MAPS
                </a>
              )}
            </div>
          )}

          {/* DROPDOWN DESKTOP */}
          {suggestions.length > 0 && showSuggestions && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-y-auto max-h-72 animate-in fade-in slide-in-from-top-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left p-3 hover:bg-indigo-50 border-b border-slate-50 last:border-none transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-white transition-colors">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">
                        {s.street} {s.housenumber}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">
                        {s.city} ({s.state}) — {s.postcode}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
              
              {suggestions.length === 0 && !loading && watchVia && watchVia.length >= 3 && (
                <div className="p-4 bg-slate-50">
                  <p className="text-xs text-slate-500 mb-2">Nessun indirizzo trovato.</p>
                  <button 
                    type="button"
                    onClick={() => { setIsManual(true); setShowSuggestions(false); }}
                    className="w-full p-2.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white border border-indigo-100 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Inserisci manualmente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CIVICO */}
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 text-center block">Civico *</label>
          <input 
            value={isHookForm ? watch?.(fieldMapping?.civico || "civico") : (value?.civico || "")} 
            onChange={(e) => handleFieldChange("civico", e.target.value)} 
            className={`${inputClass("civico")} text-center`}
          />
        </div>

        {/* PROVINCIA */}
        <div className="col-span-1 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 text-center block">Prov *</label>
          <select 
            value={watchProv || ""}
            disabled={!isManual && !watchProv}
            onChange={(e) => handleFieldChange("provincia", e.target.value)}
            className={`${inputClass("provincia")} text-center uppercase appearance-none`}
          >
            <option value=""></option>
            {provinceList.map(p => <option key={p.sigla} value={p.sigla}>{p.sigla}</option>)}
          </select>
        </div>

        {/* COMUNE */}
        <div className="col-span-3 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1">Comune *</label>
          <select 
            value={watchComune || ""}
            disabled={!isManual && !watchProv}
            onChange={(e) => handleFieldChange("comune", e.target.value)}
            className={inputClass("comune")}
          >
            <option value="">{ (isManual || watchProv) ? "Scegli..." : "---"}</option>
            {comuni.map(c => <option key={c.codiceIstat} value={c.nome}>{c.nome}</option>)}
          </select>
        </div>

        {/* CAP */}
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase text-slate-400 ml-1 text-center block">CAP *</label>
          <select 
            value={(isHookForm ? watch?.(fieldMapping?.cap || "cap") : value?.cap) || ""}
            disabled={!isManual && !watchComune}
            onChange={(e) => handleFieldChange("cap", e.target.value)}
            className={`${inputClass("cap")} text-center`}
          >
            <option value="">{ (isManual || watchComune) ? "..." : "---"}</option>
            {caps.map(cap => <option key={cap} value={cap}>{cap}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};
