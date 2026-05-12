/**
 * Utility per servizi geografici: Geocoding (Nominatim) e Routing (OSRM)
 */

/**
 * Funzione di delay per rispettare i ToS di Nominatim (1 richiesta al secondo)
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ottiene le coordinate (latitudine e longitudine) da un indirizzo testuale tramite Nominatim
 */
export async function getCoordinates(
  address: string,
  city: string,
  prov: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    // Rispetto ToS: 1 secondo di attesa prima della chiamata
    await delay(1000);

    const query = `${address}, ${city}, ${prov}, Italy`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&limit=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AI2CED-App (contatto: paoletti@agenziaitalia2.it)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('getCoordinates error:', error);
    return null;
  }
}

/**
 * Ottiene la distanza stradale tra due punti tramite OSRM
 */
export async function getRoadDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number | null> {
  try {
    // Formato OSRM: lon,lat;lon,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // La distanza restituita è in metri, convertiamo in km
      return data.routes[0].distance / 1000;
    }

    return null;
  } catch (error) {
    console.error('getRoadDistance error:', error);
    return null;
  }
}
