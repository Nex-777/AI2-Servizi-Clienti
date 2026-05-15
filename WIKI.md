# AI2 - Servizi Clienti | Project Wiki

## Stato del Progetto
Versione Attuale: **v1.0.47**
Ultimo Aggiornamento: 15/05/2026

## Progressi Raggiunti
- [x] **Gestione Santo Patrono**: Implementata logica per il riconoscimento automatico del Santo Patrono basata sulla sede del foglio presenze.
- [x] **Dropdown Cantiere Avanzato**: Migliorata la leggibilità del selettore cantiere/sede, ora con dettagli completi su indirizzo e committente.
- [x] **Gestione Sedi Addizionali**: Nuova interfaccia per la creazione e modifica di sedi secondarie con supporto a coordinate geografiche e date patrono specifiche.
- [x] **Correzione Formato Date**: Normalizzato il formato delle date patrono a `DD-MM` per coerenza con gli standard locali.
- [x] **Riepilogo Trasferte KM**: Integrato calcolo automatico dei giorni di trasferta suddivisi per fasce chilometriche (Sede, 10km, 20km, 30km, >30km).
- [x] **Esportazione Excel**: Aggiunta funzionalità di download riepilogo in formato `.xlsx` per elaborazione esterna (GIS/Paghe).
- [x] **Stampa PDF Professionale**: Implementato layout di stampa ottimizzato (A4 Landscape) che nasconde gli elementi di navigazione e formatta correttamente le tabelle per l'archiviazione cartacea.
- [x] **Gestione Ticket INPS**: Aggiunta colonna `ticket_inps` per le fasi CIG, con supporto alla copia rapida del codice alfanumerico per l'amministratore.
- [x] **Inizializzazione Automatica SEDE**: Migliorata l'esperienza utente compilando automaticamente la riga "Cantiere/Sede" con la sede principale o l'ultimo cantiere attivo all'apertura di un nuovo foglio vuoto.
- [x] **Integrazione Resend**: Migliorato il sistema di notifiche DNL con invio via `noreply@ai2serviziclienti.it` e template HTML arricchito con dettagli cantiere e subappaltatori.
- [x] **Hardening Dati Cantiere**: Rimossa dipendenza da servizi di geolocalizzazione esterni in favore di una gestione più snella basata su fasce chilometriche predefinite.
- [x] **Redesign Riepilogo GIS**: Nuova interfaccia premium per il modal di controllo; inclusa testata scura, griglia statistiche e tabella dettagliata dei contatori software.
- [x] **Logica GIS Avanzata**: Implementato calcolo automatico "Ore Non Giustificate" e integrata la gestione di tutti i codici assenza (Maternità, Allattamento, Donazione, CIG, ecc.) nei totali di controllo.
- [x] **Note per lo Studio**: Aggiunta sezione "Comunicazioni allo Studio" collassabile con salvataggio persistente per note extra e rettifiche.
- [x] **Distanza Chilometrica**: Visualizzazione automatica dei chilometri `(X.X KM)` accanto alla Ragione Sociale/Indirizzo del cantiere nel selettore.
- [x] **Ottimizzazione UI**: Pulizia righe ridondanti nel Dashboard CIG e aggiunta icone di collegamento rapido (`ExternalLink`) per i riepiloghi mensili.
- [x] **Supporto Festività**: Implementata gestione automatica festività italiane (inclusa Pasqua/Pasquetta) con evidenziazione cromatica differenziata nel calendario.
- [x] **Sicurezza Cancellazione**: Introdotta doppia conferma inline per la rimozione dei giustificativi per prevenire cancellazioni accidentali.
- [x] **Evoluzione Admin**: Nuova interfaccia di gestione Clienti e Cantieri con supporto al caricamento massivo di file presenze via CSV.
- [x] **Ottimizzazione Parser**: Migliorata l'accuratezza del parsing CSV per la corretta associazione di matricole e orari contrattuali.
- [x] **Stabilità UI**: Affinata la gestione dello stato optimistic per garantire fluidità visiva durante le operazioni asincrone di salvataggio/reset.
- [x] **Repository GitHub**: Creata e configurata repository ufficiale `Nex-777/AI2-Servizi-Clienti`.
- [x] **Gestione Versioning**: Implementato sistema di tracking versione visibile in UI (layout) e sincronizzato con `package.json`.
- [x] **Security & Secret Scanning**: Attivata protezione push per chiavi API e configurato `.gitignore` per escludere file di configurazione locali (`.claude`).
- [x] **Ambiente di Sviluppo**: Stabilizzato server di preview sulla porta locale `6173`.
- [x] **Rifinitura Login**: Ottimizzata la `LoginPage` con gestione migliorata dei codici di accesso, feedback errori e integrazione logo aziendale.
- [x] **Cestino Causali**: Risolto bug del popup che spariva. Implementata conferma inline "Sì/No" direttamente nella cella per evitare blocchi del browser.
- [x] **Gestione Causali**: Ottimizzato l'aggiornamento della UI (Optimistic UI) che ora è istantaneo senza ricaricare la pagina.
- [x] **Riga Contrattuali**: Sostituita la dicitura "Teoriche" con "Contrattuali". La riga è popolata con l'orario ordinario caricato dall'admin tramite CSV.
- [x] **Logica Ore Lavorate**: Le ore lavorate sono inizializzate al valore contrattuale. L'utente può modificarle solo in aumento (per gestire gli straordinari). Non è possibile scendere sotto l'orario contrattuale; per le assenze è obbligatorio l'uso dei giustificativi.
- [x] **Ore Notturne**: Abilitata la modifica della riga "di cui notturne". Implementata validazione (sia client che server) per impedire che le ore notturne superino le ore lavorate della giornata.
- [x] **Gestione Dal/Al (Range Save)**: Risolto bug che compilava solo il primo giorno. Ora il sistema usa le `ore_contrattuali` come riferimento per saltare i giorni non lavorativi (weekend) e compilare correttamente l'intero periodo.
- [x] **Campi Note Giustificativi**: Implementata casella descrittiva per il giustificativo `GEN` (Generale). Aggiunto indicatore visivo (pallino ambra) nelle celle che contengono una nota, visibile anche al passaggio del mouse.

## Task Pendenti (Prossima Sessione)
- [ ] **Miglioramento UI Periodo**: Valutare se aggiungere un'anteprima dei giorni che verranno compilati nel range selezionato.
- [ ] **Statistiche Avanzate**: Analisi dei costi chilometrici per cantiere basati sulle fasce km.

---
*Documento aggiornato da Antigravity.*
