import Papa from 'papaparse'

export interface DipendenteParsed {
  matricola: string
  cognomeNome: string // senza CF
  giorni: Record<number, {
    oreLavorate: number | null
    oreNotturne: number | null
    turno: string | null
    causali: Array<{ numero: number; codice: string | null; ore: number | null }>
  }>
}

export interface FoglioParsed {
  azienda: string
  sede: string
  anno: number
  mese: number
  dipendenti: DipendenteParsed[]
}

/**
 * Parse a GIS CSV file buffer/string into structured data.
 * The GIS CSV format:
 *   Row 0: Azienda | [val] | Sede | [val]
 *   Row 1: Anno | [val] | Mese | [val]
 *   Row 3: Matricola | Cognome e nome | Tipo | 1 | 2 | ... | 31
 *   Then per-employee blocks of 13 rows:
 *     Ore lavorate | di cui notturne | Causale 1 | Ore | Causale 2 | Ore | ... x5 | Turno
 */
export function parseGisCsv(csvText: string): FoglioParsed {
  // Se il file contiene punti e virgola ma Papa non lo rileva, forziamolo
  const hasSemicolon = csvText.includes(';')
  const { data: rows } = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
    header: false,
    delimiter: hasSemicolon ? ';' : '',
  })

  // Extract header metadata
  const row0 = rows.find(r => r.some(c => String(c).toLowerCase().includes('azienda'))) || rows[0] || []
  const row1 = rows.find(r => r.some(c => String(c).toLowerCase().includes('anno'))) || rows[1] || []

  // Cerchiamo l'indice della colonna dopo "Azienda"
  const aziendaIdx = row0.findIndex(c => String(c).toLowerCase().includes('azienda'))
  const azienda = aziendaIdx !== -1 ? String(row0[aziendaIdx + 1] || '').trim() : ''

  const sedeIdx = row0.findIndex(c => String(c).toLowerCase().includes('sede'))
  const sede = sedeIdx !== -1 ? String(row0[sedeIdx + 1] || '').trim() : ''

  const annoIdx = row1.findIndex(c => String(c).toLowerCase().includes('anno'))
  const anno = annoIdx !== -1 ? parseInt(String(row1[annoIdx + 1] || '0').trim(), 10) : 0

  const meseIdx = row1.findIndex(c => String(c).toLowerCase().includes('mese'))
  const mese = meseIdx !== -1 ? parseInt(String(row1[meseIdx + 1] || '0').trim(), 10) : 0

  // Find header row (contains "Matricola")
  let headerRowIdx = -1
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].some(c => String(c).toLowerCase().includes('matricola'))) {
      headerRowIdx = i
      break
    }
  }

  if (headerRowIdx === -1) {
    throw new Error('CSV: intestazione "Matricola" non trovata')
  }

  // Day columns start at index 3 (1..31)
  // rows[headerRowIdx][3] = "1", [4] = "2", ...
  const dataStart = headerRowIdx + 1
  const dipendenti: DipendenteParsed[] = []

  let i = dataStart
  while (i < rows.length) {
    const row = rows[i]
    const matricola = String(row[0] || '').trim()
    const rawNome = String(row[1] || '').trim()

    // Skip empty rows or header repetitions
    if ((!matricola && !rawNome) || matricola.toLowerCase().includes('matricola') || rawNome.toLowerCase().includes('cognome')) {
      i++
      continue
    }

    // Strip CF: "COGNOME NOME - CF" → "COGNOME NOME"
    const cognomeNome = rawNome.includes(' - ')
      ? rawNome.split(' - ')[0].trim()
      : rawNome

    // Read rows for this employee until we hit a new employee or end of file
    // Each employee block should contain specific row types
    const expectedTypes = [
      'ore lavorate',
      'di cui notturne',
      'causale 1', 'ore',
      'causale 2', 'ore',
      'causale 3', 'ore',
      'causale 4', 'ore',
      'causale 5', 'ore',
      'turno'
    ]

    const block: Record<string, string[]> = {}
    let rowsProcessed = 0
    
    // Peek ahead to gather rows for this employee block (max 20 rows to be safe)
    for (let j = 0; j < 20 && (i + j) < rows.length; j++) {
      const currentRow = rows[i + j]
      const tipo = String(currentRow[2] || '').trim().toLowerCase()
      
      // If we see a new matricola (and it's not the current one) or a header, we stop
      if (j > 0 && currentRow[0] && String(currentRow[0]).trim() !== matricola) break
      if (j > 0 && String(currentRow[0]).toLowerCase().includes('matricola')) break

      if (tipo) {
        block[tipo] = currentRow
      }
      rowsProcessed = j + 1
    }

    // Validate block has at least 'ore lavorate'
    if (!block['ore lavorate']) {
      i += rowsProcessed || 1
      continue
    }

    // Parse days 1..31 (columns index 3..33)
    const giorni: DipendenteParsed['giorni'] = {}

    for (let g = 1; g <= 31; g++) {
      const colIdx = 3 + (g - 1) // col 3 = giorno 1

      const oreLav = parseFloat(String(block['ore lavorate']?.[colIdx] || '').trim().replace(',', '.'))
      const oreNot = parseFloat(String(block['di cui notturne']?.[colIdx] || '').trim().replace(',', '.'))
      const turno = String(block['turno']?.[colIdx] || '').trim() || null

      const causali: DipendenteParsed['giorni'][number]['causali'] = []
      for (let c = 1; c <= 5; c++) {
        const codice = String(block[`causale ${c}`]?.[colIdx] || '').trim() || null
        // The 'Ore' row might be generic 'ore' multiple times or 'ore' following each causale
        // In the GIS format, it's usually: Causale 1, Ore, Causale 2, Ore...
        // Our 'block' mapping might overwrite 'ore' if we use it as key.
        // Let's check the original rows for 'ore' relative to the causale row.
        
        // Find the index of the 'Causale X' row in the original rows to find the 'Ore' row right after it
        let oreVal = null
        for (let rIdx = 0; rIdx < rowsProcessed; rIdx++) {
          const rowText = String(rows[i + rIdx][2] || '').toLowerCase()
          if (rowText === `causale ${c}`) {
            const nextRow = rows[i + rIdx + 1]
            if (nextRow && String(nextRow[2] || '').toLowerCase() === 'ore') {
              const rawOre = String(nextRow[colIdx] || '').trim().replace(',', '.')
              oreVal = parseFloat(rawOre)
            }
            break
          }
        }

        causali.push({
          numero: c,
          codice,
          ore: (oreVal !== null && !isNaN(oreVal)) ? oreVal : null,
        })
      }

      giorni[g] = {
        oreLavorate: isNaN(oreLav) ? null : oreLav,
        oreNotturne: isNaN(oreNot) ? null : oreNot,
        turno,
        causali,
      }
    }

    dipendenti.push({ matricola, cognomeNome, giorni })
    i += rowsProcessed
  }

  return { azienda, sede, anno, mese, dipendenti }
}

/**
 * Reconstruct a GIS CSV string from DB data.
 * Used when sending the final CSV to the admin via email.
 */
export function buildGisCsv(foglio: {
  azienda: string
  sede: string
  anno: number
  mese: number
  dipendenti: Array<{
    matricola: string
    cognomeNome: string
    giorni: DipendenteParsed['giorni']
  }>
}): string {
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1))

  const rows: string[][] = []

  // Header metadata
  rows.push(['Azienda', foglio.azienda, 'Sede', foglio.sede])
  rows.push(['Anno', String(foglio.anno), 'Mese', String(foglio.mese)])
  rows.push([]) // empty row
  rows.push(['Matricola', 'Cognome e nome', 'Tipo', ...days])

  // Per-employee blocks
  for (const dip of foglio.dipendenti) {
    const g = dip.giorni

    const makeRow = (tipo: string, getValue: (giorno: number) => string | number | null) =>
      [dip.matricola, dip.cognomeNome, tipo, ...days.map((_, i) => String(getValue(i + 1) ?? ''))]

    rows.push(makeRow('Ore lavorate', d => g[d]?.oreLavorate ?? ''))
    rows.push(makeRow('di cui notturne', d => g[d]?.oreNotturne ?? ''))

    for (let c = 0; c < 5; c++) {
      rows.push(makeRow(`Causale ${c + 1}`, d => g[d]?.causali[c]?.codice ?? ''))
      rows.push(makeRow('Ore', d => g[d]?.causali[c]?.ore ?? ''))
    }

    rows.push(makeRow('Turno', d => g[d]?.turno ?? ''))
  }

  return Papa.unparse(rows)
}
