import { useState, useEffect, useCallback } from 'react';

export interface ORSSuggestion {
  street: string;
  housenumber: string;
  city: string;
  state: string; // Provincia
  postcode: string;
  fullAddress: string;
  lat: number;
  lon: number;
}

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY;

export function useORSAutocomplete(query: string, city?: string, state?: string) {
  const [suggestions, setSuggestions] = useState<ORSSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (q: string, city?: string, state?: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }

    if (!ORS_API_KEY) {
      console.error("ORS API Key missing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = new URL('https://api.openrouteservice.org/geocode/autocomplete');
      url.searchParams.append('api_key', ORS_API_KEY);
      
      // Arricchiamo la query con il contesto geografico se presente
      let fullQuery = q;
      if (city) fullQuery += `, ${city}`;
      if (state) fullQuery += `, ${state}`;
      
      url.searchParams.append('text', fullQuery);
      url.searchParams.append('boundary.country', 'IT');
      url.searchParams.append('layers', 'address,venue');
      url.searchParams.append('size', '10');

      const response = await fetch(url.toString());
      
      if (!response.ok) throw new Error('Errore nel recupero dei suggerimenti da ORS');
      
      const data = await response.json();
      
      const normalized: ORSSuggestion[] = data.features.map((f: any) => {
        const p = f.properties;
        const coords = f.geometry.coordinates; // [lon, lat]
        
        const street = p.street || '';
        const housenumber = p.housenumber || '';
        const city = p.localadmin || p.locality || p.city || p.town || '';
        const state = p.region_a || p.county || ''; // Spesso region_a è la sigla della provincia in Pelias/ORS
        const postcode = p.postalcode || '';
        
        // Costruiamo un indirizzo completo leggibile
        const fullAddress = p.label || [
          street, 
          housenumber, 
          city, 
          state
        ].filter(Boolean).join(', ');

        return { 
          street, 
          housenumber, 
          city, 
          state, 
          postcode, 
          fullAddress,
          lat: coords[1],
          lon: coords[0]
        };
      });

      setSuggestions(normalized);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && query.length >= 3) {
        fetchSuggestions(query, city, state);
      } else {
        setSuggestions([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, city, state, fetchSuggestions]);

  return { suggestions, loading, error };
}
