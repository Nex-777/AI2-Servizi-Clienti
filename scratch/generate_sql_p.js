
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

const hq = { lat: 42.849773, lon: 13.673286 };
const data = [
  { "cod": "P19", "coords": { "lat": 42.955042, "lon": 13.6434 } },
  { "cod": "P20", "coords": { "lat": 42.9058405, "lon": 13.8871669 } },
  { "cod": "P21", "coords": { "lat": 42.8587364, "lon": 13.5813254 } },
  { "cod": "P22", "coords": { "lat": 42.822753, "lon": 13.6364276 } },
  { "cod": "P18", "coords": { "lat": 42.8701405, "lon": 13.5845631 } }
];

data.forEach(item => {
  const dist = calculateDistance(hq.lat, hq.lon, item.coords.lat, item.coords.lon);
  console.log(`UPDATE public.cantieri SET lat = ${item.coords.lat}, lon = ${item.coords.lon}, distanza_km = ${dist.toFixed(4)} WHERE cod = '${item.cod}' AND client_id = '2cfe3909-86fc-4892-9a3d-5436a40cc2de';`);
});
