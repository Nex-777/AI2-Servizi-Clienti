import * as XLSX from 'xlsx';

export function exportToExcel(
  azienda: string,
  sede: string | null,
  anno: number,
  mese: number,
  dipendenti: any[],
  daysInMonth: number,
  cantieri: any[] = []
) {
  const MESI = ['', 'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  
  const workbook = XLSX.utils.book_new();
  const data: any[][] = [];

  // KM Mapping Logic (Duplicate from FoglioPresenze for simplicity in export)
  const getKMCode = (dist: string | null | undefined) => {
    if (!dist || dist === 'SEDE' || dist === '0') return '0'
    if (dist.includes('10Km') && dist.includes('Fino')) return '4800'
    if (dist.includes('10') && dist.includes('20')) return '4801'
    if (dist.includes('20') && dist.includes('30')) return '4802'
    if (dist.includes('Oltre') || dist.includes('>30')) return '4803'
    return '4800' // Default fallback
  }

  const KM_CODES = ['0', '4800', '4801', '4802', '4803']

  // Header
  data.push([`AZIENDA: ${azienda.toUpperCase()}`]);
  if (sede) data.push([`SEDE: ${sede.toUpperCase()}`]);
  data.push([`PERIODO: ${MESI[mese]} ${anno}`]);
  data.push([]); // Spacer

  // Table Header
  const headerRow = ['DIPENDENTE / MATRICOLA', 'TIPO'];
  for (let i = 1; i <= daysInMonth; i++) {
    headerRow.push(i.toString());
  }
  headerRow.push('TOTALE');
  data.push(headerRow);

  // Rows for each dipendente
  dipendenti.forEach(dip => {
    // 1. Worked Hours Row
    const workedRow: (string | number)[] = [`${dip.cognome_nome} (MAT. ${dip.matricola})`, 'LAV'];
    let workedTot = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const g = dip.giornate.find((x: any) => x.giorno === i);
      const val = g?.ore_lavorate || 0;
      workedRow.push(val > 0 ? val : '');
      workedTot += val;
    }
    workedRow.push(workedTot);
    data.push(workedRow);

    // 2. Night Hours Row (only if present)
    const hasNight = dip.giornate.some((x: any) => x.ore_notturne && x.ore_notturne > 0);
    if (hasNight) {
      const nightRow: (string | number)[] = ['', 'NOT'];
      let nightTot = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        const g = dip.giornate.find((x: any) => x.giorno === i);
        const val = g?.ore_notturne || 0;
        nightRow.push(val > 0 ? val : '');
        nightTot += val;
      }
      nightRow.push(nightTot);
      data.push(nightRow);
    }

    // 3. KM Transfers Row
    const kmSummary: Record<string, number> = { '0': 0, '4800': 0, '4801': 0, '4802': 0, '4803': 0 }
    dip.giornate.forEach((g: any) => {
      // Logic from FoglioPresenze: worked hours > 0 and has turno
      const oreCausaliDay = (dip.causali || [])
        .filter((c: any) => c.giorno === g.giorno)
        .reduce((acc: number, c: any) => acc + (c.ore || 0), 0)
      const workedEffective = Math.max(0, (g.ore_lavorate || 0) - oreCausaliDay)
      
      if (workedEffective > 0 && g.turno) {
        const cInfo = (cantieri || []).find(c => (c.cod || c.cantiere) === g.turno)
        const kmCode = getKMCode(cInfo?.distanza_km)
        kmSummary[kmCode]++
      }
    })

    const activeKmCodes = KM_CODES.filter(code => kmSummary[code] > 0 || code === '0')
    if (activeKmCodes.length > 0) {
      activeKmCodes.forEach(code => {
        const row: (string | number)[] = ['', `KM ${code === '0' ? 'SEDE' : code}`];
        // Fill empty days
        for (let i = 1; i <= daysInMonth; i++) row.push('');
        row.push(`${kmSummary[code]} gg`);
        data.push(row);
      });
    }

    // 4. Causals Row(s)
    for (let n = 1; n <= 5; n++) {
      const hasCausal = dip.causali.some((c: any) => c.numero === n && c.codice);
      if (hasCausal) {
        const cRow: (string | number)[] = ['', `CAUS ${n}`];
        let cTot = 0;
        for (let i = 1; i <= daysInMonth; i++) {
          const c = dip.causali.find((x: any) => x.giorno === i && x.numero === n);
          if (c?.codice) {
            cRow.push(`${c.codice} (${c.ore}h)`);
            cTot += c.ore || 0;
          } else {
            cRow.push('');
          }
        }
        cRow.push(cTot);
        data.push(cRow);
      }
    }
    
    data.push([]); // Spacer between employees
  });

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  
  worksheet['!cols'] = [
    { wch: 30 }, // Name
    { wch: 10 }, // Type
    ...Array(daysInMonth).fill({ wch: 6 }), // Days
    { wch: 10 }  // Total
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Segna Ore');
  
  const filename = `Segna_Ore_${azienda.replace(/\s+/g, '_')}_${MESI[mese]}_${anno}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
