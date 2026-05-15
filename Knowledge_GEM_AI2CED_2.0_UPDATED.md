# Istruzioni Knowledge GEM - AI2CED 2.0 (Aggiornato 15/05/2026)

Questo documento serve a istruire il GEM (Generative Entity Model) di Gemini sulla base di conoscenza del progetto AI2 Servizi Clienti.

## 1. Contesto Tecnico e Architettura
*   **Core Stack**: Frontend **React (Next.js 14+)** ottimizzato per performance elevate su mobile e desktop. Backend **Supabase** (PostgreSQL, Auth, Edge Functions, RLS).
*   **Design System**: 
    *   **Desktop**: Visualizzazione tabellare con "sticky column" per i nomi dei dipendenti.
    *   **Mobile**: Layout verticale a "Card". Ogni dipendente ha una scheda dedicata; i giorni sono visualizzati in righe per evitare lo scroll orizzontale.
*   **Autenticazione**: Accesso protetto via email/password. Ruoli: `client` (aziende clienti) e `super_admin` (consulenti AI2).
*   **Sicurezza (RLS)**: Row Level Security attiva su tutte le tabelle. Ogni azienda accede solo ai propri dipendenti e cantieri. Gli amministratori possono impersonare i clienti per supporto tecnico.
*   **Validazioni**: Controllo massimale 12h lavorate/giorno, gestione festività nazionali italiane (inclusa Pasquetta e 4 Ottobre - San Francesco).

## 2. Modulo Presenze e Giustificativi
*   **Motore Giustificativi**: Inserimento ore e causali basato strettamente sui codici **GIS**. Nessun campo di testo libero per i codici, per garantire l'integrità dei dati in esportazione.
*   **Elenco Causali Comuni**:
    *   `*FE` / `*FD`: Ferie (FD per settore Edile)
    *   `*PE` / `*PD`: Permessi (PD per settore Edile)
    *   `*RO`: ROL
    *   `*EF`: EX Festività
    *   `*ML`: Malattia
    *   `*IN`: Infortunio
    *   `*PA`: Permessi aziendali
    *   `*NP`: Assenza non retribuita
    *   `*DS`: Donazione sangue
    *   `*MT` / `*MO`: Maternità (Obbligatoria/Facoltativa)
    *   `*AT`: Allattamento
    *   `GEN`: Generale (note libere)
*   **Cassa Integrazione (CIG)**:
    *   Codici: `*GG` (CIG Ord. atmos. ridotta - no anticipo), `*GH` (con anticipo), `*GJ` (zero ore - no anticipo), `*GK` (zero ore - con anticipo).
    *   Gestione causali meteo: Pioggia, Neve, Caldo, Gelo, Vento.
    *   Associazione automatica di **Ticket INPS** e fasi lavorative al foglio presenze.
*   **Trasferte e Kilometri (KM)**:
    *   Gestione fasce chilometriche per rimborsi:
        *   `0`: In Sede / 0km
        *   `4800`: Fino a 10km
        *   `4801`: Da 10km a 20km
        *   `4802`: Da 20km a 30km
        *   `4803`: Oltre 30km

## 3. Gestione Cantieri e DNL (Denuncia Nuovo Lavoro)
*   **Anagrafica Evoluta**: Gestione indirizzi, codici univoci, CIG, CUP, importo lavori edili e descrizione attività.
*   **Subappalti**: Gestione anagrafica subappaltatori associati al cantiere (Ragione Sociale, CF/PIVA, email, tipo lavoro).
*   **Workflow DNL**: Sistema di invio automatico a `paoletti@agenziaitalia2.it` tramite Resend. Il sistema genera un riepilogo formattato con tutti i dati del committente, del cantiere e dei subappaltatori.
*   **Stati Cantiere**: `bozza`, `da_inviare`, `inviata`, `confermato`. Possibilità di archiviazione cantieri terminati.

## 4. Integrazione Dati e Export
*   **Importazione GIS**: Parsing automatico di file CSV generati dal software GIS per popolare i dipendenti e le anagrafiche.
*   **Esportazione**: Generazione di file Excel professionali per il controllo amministrativo e file CSV pronti per l'importazione nei sistemi paghe.

## 5. Protocollo Operativo Agenti Antigravity
*   ** Engineering Manager**: Scompone i requisiti in task atomici.
*   **Software Architect**: Definisce schemi DB e policy di sicurezza.
*   **Technical Lead**: Scrive codice React/Supabase pulito e tipizzato.
*   **Protocollo di Blocco**: Se un task richiede un'azione manuale (es. configurazione chiavi API su Supabase), l'agente DEVE fermarsi, fornire istruzioni passo-passo e attendere il "FATTO" dell'utente.

---
**Nota per il GEM**: Utilizza queste informazioni per rispondere a domande tecniche, assistere nello sviluppo di nuove feature o spiegare il funzionamento del sistema agli utenti.
