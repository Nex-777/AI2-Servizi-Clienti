# Protocollo di Collaborazione: Agente Remoto & LM Studio

Questo documento definisce le linee guida (non vincolanti) per la delega di compiti al modello locale, da attivare solo quando garantisce efficienza e velocità.

## 1. Caratteristiche Hardware e Modello (Aggiornato)
- **Modello Locale**: `qwen2.5-coder-3b-instruct` (ottimizzato).
- **Velocità di Riferimento**: ~11 token/sec.
- **Soglia di Timeout / Limite Output**: 600 token (~150 righe) per chiamata sicura.
- **Context Window Stimata**: 8192 - 32768 token (dipende dalla RAM).

## 2. Esempi di compiti delegabili
L'agente principale può delegare a LM Studio nelle seguenti situazioni:
- **Generazione di Boilerplate**: Interfacce TS, schemi Zod, classi DTO, tipi di database.
- **Logica Algoritmica Pura**: Funzioni di calcolo (es. distanze, ore, formattazione date).
- **Componenti UI Atomici**: Singoli elementi React/Tailwind (bottoni, input, card) fino a 100 righe.
- **Data Transformation**: Conversione di formati dati (es. da CSV a JSON).

## 3. Restrizioni (No-Delega)
L'agente principale NON deve delegare se:
- **Integrazione di Sistema**: Il compito richiede la conoscenza di troppi file contemporaneamente.
- **Rischio Timeout**: La risposta prevista supera i 600 token.
- **Debug Complesso**: Il problema richiede un'analisi multi-step.

## 4. Standard di Prompting per LM Studio
- **Concisi**: Inviare solo gli snippet di codice necessari.
- **Diretti**: Usare comandi imperativi.
- **Output-Oriented**: Specificare sempre "Rispondi solo con il codice, no testo, no spiegazioni".

## 5. Valutazione Efficienza (Token ROI)
Per ogni chiamata a Qwen, l'agente principale deve valutare il bilancio dei token:
- **Calcolo**: `ROI = [Token prodotti da Qwen] - [Token di contesto inviati]`.
- **Reporting (MANDATORIO)**: L'agente DEVE aggiungere un'etichetta a fine messaggio: `[Token ROI: +X (Qwen)]`.
- **Ottimizzazione**: Se il ROI è sistematicamente negativo, l'agente deve cessare la delega per quel task.

---
*Ultimo aggiornamento: 2026-05-13 - Configurazione Qwen 2.5 Coder 3B.*
