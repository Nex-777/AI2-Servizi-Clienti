# AI2 - Servizi Clienti | Project Wiki

## Stato del Progetto
Versione Attuale: **v1.0.35**
Ultimo Aggiornamento: 01/05/2026

## Progressi Raggiunti
- [x] **Cestino Causali**: Risolto bug del popup che spariva. Implementata conferma inline "Sì/No" direttamente nella cella per evitare blocchi del browser.
- [x] **Gestione Causali**: Ottimizzato l'aggiornamento della UI (Optimistic UI) che ora è istantaneo senza ricaricare la pagina.
- [x] **Riga Teoriche**: Aggiunta riga di sola lettura con l'orario ordinario previsto per riferimento.
- [x] **Blocco Riduzione Ore**: Implementata validazione che impedisce di salvare ore lavorate inferiori alle teoriche.
- [x] **Invio Email (Base)**: Configurato Resend per l'invio del CSV. Attualmente impostato per inviare a `nexglg@gmail.com` per bypassare le restrizioni della Sandbox.
- [x] **Gestione Dal/Al (Range Save)**: Risolto bug che compilava solo il primo giorno. Ora il sistema usa le `ore_teoriche` come riferimento per saltare i giorni non lavorativi (weekend) e compilare correttamente l'intero periodo.
- [x] **Campi Note Giustificativi**: Implementata casella descrittiva per il giustificativo `GEN` (Generale). Aggiunto indicatore visivo (pallino ambra) nelle celle che contengono una nota, visibile anche al passaggio del mouse.

## Task Pendenti (Prossima Sessione)
- [ ] **Verifica Dominio Resend**: 
    - [ ] Aggiungere record DNS su `agenziaitalia2.it`.
    - [ ] Abilitare invio a destinatari esterni (consulenti/ufficio paghe).
    - [ ] Ripristinare `process.env.ADMIN_EMAIL` come destinatario dinamico.
- [ ] **Miglioramento UI Periodo**: Valutare se aggiungere un'anteprima dei giorni che verranno compilati nel range selezionato.

---
*Documento aggiornato da Antigravity.*
