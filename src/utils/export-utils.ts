
export function exportToCSV(
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
  
  const rows: string[][] = [];

  // KM Mapping Logic
  const getKMCode = (dist: string | null | undefined) => {
    if (!dist || dist === 'SEDE' || dist === '0') return '0'
    const d = dist.toLowerCase();
    if (d.includes('10km') && d.includes('fino')) return '4800'
    if (d.includes('10') && d.includes('20')) return '4801'
    if (d.includes('20') && d.includes('30')) return '4802'
    if (d.includes('oltre') || d.includes('>30')) return '4803'
    return '4800'
  }

  const KM_CODES = ['0', '4800', '4801', '4802', '4803']

  // Header
  rows.push([`AZIENDA: ${azienda.toUpperCase()}`]);
  if (sede) rows.push([`SEDE: ${sede.toUpperCase()}`]);
  rows.push([`PERIODO: ${MESI[mese]} ${anno}`]);
  rows.push([]);

  // Table Header
  const headerRow = ['DIPENDENTE / MATRICOLA', 'TIPO'];
  for (let i = 1; i <= daysInMonth; i++) {
    headerRow.push(i.toString());
  }
  headerRow.push('TOTALE');
  rows.push(headerRow);

  // Rows for each dipendente
  dipendenti.forEach(dip => {
    const workedRow: string[] = [`"${dip.cognome_nome} (MAT. ${dip.matricola})"`, 'LAV'];
    let workedTot = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const g = dip.giornate.find((x: any) => x.giorno === i);
      const val = g?.ore_lavorate || 0;
      workedRow.push(val > 0 ? val.toString().replace('.', ',') : '');
      workedTot += val;
    }
    workedRow.push(workedTot.toString().replace('.', ','));
    rows.push(workedRow);

    const hasNight = dip.giornate.some((x: any) => x.ore_notturne && x.ore_notturne > 0);
    if (hasNight) {
      const nightRow: string[] = ['', 'NOT'];
      let nightTot = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        const g = dip.giornate.find((x: any) => x.giorno === i);
        const val = g?.ore_notturne || 0;
        nightRow.push(val > 0 ? val.toString().replace('.', ',') : '');
        nightTot += val;
      }
      nightRow.push(nightTot.toString().replace('.', ','));
      rows.push(nightRow);
    }

    const kmSummary: Record<string, number> = { '0': 0, '4800': 0, '4801': 0, '4802': 0, '4803': 0 }
    dip.giornate.forEach((g: any) => {
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
    activeKmCodes.forEach(code => {
      const row: string[] = ['', `KM ${code === '0' ? 'SEDE' : code}`];
      for (let i = 1; i <= daysInMonth; i++) row.push('');
      row.push(`${kmSummary[code]} gg`);
      rows.push(row);
    });

    for (let n = 1; n <= 5; n++) {
      const hasCausal = dip.causali.some((c: any) => c.numero === n && c.codice);
      if (hasCausal) {
        const cRow: string[] = ['', `CAUS ${n}`];
        let cTot = 0;
        for (let i = 1; i <= daysInMonth; i++) {
          const c = dip.causali.find((x: any) => x.giorno === i && x.numero === n);
          if (c?.codice) {
            cRow.push(`"${c.codice} (${c.ore}h)"`);
            cTot += c.ore || 0;
          } else {
            cRow.push('');
          }
        }
        cRow.push(cTot.toString().replace('.', ','));
        rows.push(cRow);
      }
    }
    
    rows.push([]);
  });

  const csvContent = rows.map(r => r.join(';')).join('\n');
  const filename = `Segna_Ore_${azienda.replace(/\s+/g, '_')}_${MESI[mese]}_${anno}.csv`;

  // Server-Side Export: creiamo un form nascosto per triggerare il download dal server
  // Questo evita blocchi dei browser sui Blob URL e garantisce il nome file corretto.
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/api/export-csv';
  form.style.display = 'none';

  const contentInput = document.createElement('input');
  contentInput.type = 'hidden';
  contentInput.name = 'csvContent';
  contentInput.value = csvContent;
  form.appendChild(contentInput);

  const nameInput = document.createElement('input');
  nameInput.type = 'hidden';
  nameInput.name = 'filename';
  nameInput.value = filename;
  form.appendChild(nameInput);

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}
