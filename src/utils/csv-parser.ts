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
  const { data: rows } = Papa.parse<string[]>(csvText, {
    skipEmptyLines: false,
    header: false,
  })

  // Extract header metadata
  const row0 = rows[0] || []
  const row1 = rows[1] || []

  const azienda = String(row0[1] || '').trim()
  const sede = String(row0[3] || row0[2] || '').trim()
  const anno = parseInt(String(row1[1] || '0').trim(), 10)
  const mese = parseInt(String(row1[3] || row1[2] || '0').trim(), 10)

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

    // Skip empty rows
    if (!matricola && !rawNome) {
      i++
      continue
    }

    // Strip CF: "COGNOME NOME - CF" → "COGNOME NOME"
    const cognomeNome = rawNome.includes(' - ')
      ? rawNome.split(' - ')[0].trim()
      : rawNome

    // Read 13 rows for this employee
    const TIPO_ROWS = [
      'Ore lavorate',
      'di cui notturne',
      'Causale 1', 'Ore',
      'Causale 2', 'Ore',
      'Causale 3', 'Ore',
      'Causale 4', 'Ore',
      'Causale 5', 'Ore',
      'Turno',
    ]

    // Gather the block (current row is "Ore lavorate")
    const block: string[][] = []
    for (let b = 0; b < TIPO_ROWS.length && (i + b) < rows.length; b++) {
      block.push(rows[i + b])
    }

    // Parse days 1..31 (columns index 3..33)
    const giorni: DipendenteParsed['giorni'] = {}

    for (let g = 1; g <= 31; g++) {
      const colIdx = 3 + (g - 1) // col 3 = giorno 1

      const oreLav = parseFloat(String(block[0]?.[colIdx] || '').trim())
      const oreNot = parseFloat(String(block[1]?.[colIdx] || '').trim())
      const turno = String(block[12]?.[colIdx] || '').trim() || null

      const causali: DipendenteParsed['giorni'][number]['causali'] = []
      for (let c = 0; c < 5; c++) {
        const causaleRowIdx = 2 + c * 2     // Causale N row in block
        const oreRowIdx = 3 + c * 2         // Ore row in block
        const codice = String(block[causaleRowIdx]?.[colIdx] || '').trim() || null
        const ore = parseFloat(String(block[oreRowIdx]?.[colIdx] || '').trim())

        causali.push({
          numero: c + 1,
          codice,
          ore: isNaN(ore) ? null : ore,
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
    i += TIPO_ROWS.length
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
