# Protocollo di Collaborazione: Agente Remoto & LM Studio (Qwen 2.5 Coder)

Questo documento definisce le regole di ingaggio per la delega di compiti dall'agente principale (Antigravity) al modello locale caricato su LM Studio, al fine di ottimizzare il consumo di token e garantire la stabilità della connessione.

## 1. Caratteristiche Hardware e Modello
- **Modello Locale**: `qwen2.5-coder-7b-instruct` (o superiori).
- **Velocità di Riferimento**: ~7 token/sec.
- **Soglia di Timeout**: 60 secondi (corrispondenti a circa 400-500 token di output massimi per chiamata sicura).
- **Context Window Stimata**: 4096 - 8192 token.

## 2. Criteri di Delega (Token Saving)
L'agente principale DEVE delegare a LM Studio nelle seguenti situazioni:
- **Generazione di Boilerplate**: Interfacce TS, schemi Zod, classi DTO, tipi di database.
- **Logica Algoritmica Pura**: Funzioni di calcolo (es. distanze, ore, formattazione date) che non richiedono accesso a API esterne o database.
- **Componenti UI Atomici**: Singoli elementi React/Tailwind (bottoni, input, card) che non superano le 50-70 righe.
- **Data Transformation**: Conversione di formati dati (es. da CSV grezzo a array di oggetti).

## 3. Restrizioni (No-Delega)
L'agente principale NON deve delegare se:
- **Integrazione di Sistema**: Il compito richiede la conoscenza di più di 3 file di contesto contemporaneamente.
- **Rischio Timeout**: La risposta prevista supera i 500 token (es. intere pagine Dashboard).
- **Debug Complesso**: Il problema richiede un'analisi multi-step o log di sistema estesi.

## 4. Standard di Prompting per LM Studio
Per massimizzare l'efficienza, i prompt verso LM Studio devono essere:
- **Concisi**: Inviare solo gli snippet di codice necessari, mai file interi se non indispensabili.
- **Diretti**: Usare comandi imperativi ("Genera...", "Trasforma...").
- **Output-Oriented**: Specificare sempre "Rispondi solo con il codice, no testo, no spiegazioni" per minimizzare i token di ritorno che intasano la memoria dell'agente principale.

## 5. Valutazione Efficienza (Token ROI)
Per ogni chiamata a Qwen, l'agente principale deve valutare il bilancio dei token:
- **Calcolo**: `ROI = [Token prodotti da Qwen] - [Token di contesto inviati]`.
- **Reporting**: L'agente aggiungerà un'etichetta a fine messaggio: `[Token ROI: +X (Qwen)]`.
- **Ottimizzazione**: Se il ROI è sistematicamente negativo per un certo tipo di task, l'agente deve cessare la delega per quel task e riprendere l'elaborazione interna.

## 6. Manutenzione
- Se LM Studio restituisce un errore di connessione sulla porta 1234, l'agente deve tentare una versione "ridotta" del prompt o riprendere il compito internamente.
- Monitorare periodicamente la velocità (token/sec) per aggiornare la soglia di timeout.

---
*Ultimo aggiornamento: 2026-05-13 - Registrato su richiesta utente.*
