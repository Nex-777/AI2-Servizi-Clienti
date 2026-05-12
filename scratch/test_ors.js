const https = require('https');

const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjFkNzBlM2U2NmE2NjRmMjNiYjQ5NDMxNjgyZmQ2ZWUzIiwiaCI6Im11cm11cjY0In0=';
const text = encodeURIComponent('Via Antonio Gramsci 10, Roccafluvione');
const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${API_KEY}&text=${text}&boundary.country=IT&layers=address,venue&size=5`;

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json, null, 2));
    
    if (json.features && json.features.length > 0) {
      console.log("\n--- VERIFICA RISULTATI ---");
      json.features.forEach((f, i) => {
        const p = f.properties;
        console.log(`Risultato ${i+1}:`);
        console.log(`  Label: ${p.label}`);
        console.log(`  Street: ${p.street}`);
        console.log(`  HouseNumber: ${p.housenumber}`);
        console.log(`  Locality: ${p.locality}`);
        console.log(`  Frazione/Neighborhood: ${p.neighborhood || p.macrohood || 'N/A'}`);
        console.log(`  Region (Provincia): ${p.region_a}`);
        console.log(`  Coords: ${f.geometry.coordinates}`);
      });
    } else {
      console.log("Nessun risultato trovato.");
    }
  });
}).on('error', (err) => {
  console.error("Errore: " + err.message);
});
