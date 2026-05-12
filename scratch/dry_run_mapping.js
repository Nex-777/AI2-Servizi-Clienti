const provinces = [
  { nome: "Ancona", sigla: "AN" },
  { nome: "Milano", sigla: "MI" },
  { nome: "Roma", sigla: "RM" },
  { nome: "Ascoli Piceno", sigla: "AP" },
  { nome: "Pesaro e Urbino", sigla: "PU" },
  { nome: "Massa-Carrara", sigla: "MS" }
];

const getSiglaProvincia = (photonState) => {
  if (!photonState) return "";
  
  let cleanState = photonState
    .replace(/^provincia (di|delle|della) /i, "")
    .replace(/^città metropolitana di /i, "")
    .replace(/^libero consorzio comunale di /i, "")
    .trim();

  let found = provinces.find(p => 
    p.nome.toLowerCase() === cleanState.toLowerCase() ||
    p.nome.toLowerCase().replace("-", " ") === cleanState.toLowerCase().replace("-", " ")
  );

  if (!found) {
    found = provinces.find(p => {
      const pNome = p.nome.toLowerCase().replace("-", " ");
      const cState = cleanState.toLowerCase().replace("-", " ");
      return cState.includes(pNome) || pNome.includes(cState);
    });
  }
  
  if (!found && cleanState.length === 2) {
    const siglaUpper = cleanState.toUpperCase();
    if (provinces.some(p => p.sigla === siglaUpper)) return siglaUpper;
  }
  
  return found ? found.sigla : "N.D.";
};

const tests = [
  "Milano",
  "Provincia di Ancona",
  "Città Metropolitana di Roma",
  "Ascoli Piceno",
  "Pesaro e Urbino",
  "MI",
  "Massa Carrara"
];

console.log("--- DRY RUN: Mapping Photon State to GIS Sigla ---");
tests.forEach(t => {
  console.log(`Input: "${t}" -> Output: "${getSiglaProvincia(t)}"`);
});
