
const fetch = require('node-fetch');

async function getCoordinates(address, city, province) {
  try {
    const query = `${address}, ${city}, ${province}, Italy`;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AI2-Portal-Agent' } });
    const data = await res.json();
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (e) {
    console.error("Geocoding error:", e);
  }
  return null;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function run() {
  const cantiereAddr = "Via Antonio Gramsci 10";
  const cantiereCity = "Roccafluvione";
  const cantiereProv = "AP";
  
  const hqLat = 42.86114;
  const hqLon = 13.474371;
  
  console.log("Geocoding cantiere...");
  const coords = await getCoordinates(cantiereAddr, cantiereCity, cantiereProv);
  
  if (coords) {
    console.log("Coords:", coords);
    const dist = calculateDistance(hqLat, hqLon, coords.lat, coords.lon);
    console.log("Distance:", dist, "km");
    
    console.log(`UPDATE public.cantieri SET lat = ${coords.lat}, lon = ${coords.lon}, distanza_km = ${dist} WHERE id = '5949e590-eae5-411d-9bd7-4470864ad328';`);
  } else {
    console.log("Geocoding failed.");
  }
}

run();
