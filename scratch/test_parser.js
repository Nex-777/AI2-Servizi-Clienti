
const fs = require('fs');
const Papa = require('papaparse');

function parseGisCsv(csvText) {
  const hasSemicolon = csvText.includes(';');
  const { data: rows } = Papa.parse(csvText, {
    skipEmptyLines: true,
    header: false,
    delimiter: hasSemicolon ? ';' : '',
  });

  let azienda = '';
  let sede = '';
  let anno = 0;
  let mese = 0;

  for (const row of rows.slice(0, 10)) {
    for (let j = 0; j < row.length - 1; j++) {
      const label = String(row[j] || '').toLowerCase().trim();
      const value = String(row[j + 1] || '').trim();
      if (label === 'azienda') azienda = value;
      if (label === 'sede') sede = value;
      if (label === 'anno') anno = parseInt(value, 10);
      if (label === 'mese') mese = parseInt(value, 10);
    }
  }

  let headerRowIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(c => String(c).toLowerCase().trim() === 'matricola')) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) throw new Error('Matricola not found');

  const dipendenti = [];
  let i = headerRowIdx + 1;
  while (i < rows.length) {
    const row = rows[i];
    const matricola = String(row[0] || '').trim();
    const rawNome = String(row[1] || '').trim();

    const isHeader = matricola.toLowerCase() === 'matricola' || rawNome.toLowerCase() === 'cognome e nome';
    if ((!matricola && !rawNome) || isHeader) {
      i++;
      continue;
    }

    const dip = { matricola, cognomeNome: rawNome, giorni: {} };
    let rowsProcessed = 0;
    const block = {};
    for (let j = 0; j < 25 && (i + j) < rows.length; j++) {
      const currentRow = rows[i + j];
      const curMat = String(currentRow[0] || '').trim();
      const tipo = String(currentRow[2] || '').trim().toLowerCase();
      if (j > 0 && curMat && curMat !== matricola && curMat !== '') break;
      if (j > 0 && curMat.toLowerCase() === 'matricola') break;
      if (tipo) block[tipo] = currentRow;
      rowsProcessed = j + 1;
    }

    dipendenti.push(dip);
    i += rowsProcessed;
  }
  return { azienda, sede, anno, mese, dipendenti };
}

const csv = fs.readFileSync('PRE0000010000202604.csv', 'utf8');
const result = parseGisCsv(csv);
console.log('Result:', JSON.stringify({
  azienda: result.azienda,
  sede: result.sede,
  anno: result.anno,
  mese: result.mese,
  dipCount: result.dipendenti.length
}, null, 2));
if (result.dipendenti.length > 0) {
    console.log('First employee:', result.dipendenti[0].matricola, result.dipendenti[0].cognomeNome);
}
