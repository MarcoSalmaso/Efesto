# Efesto - Local AI Tool Environment

Efesto è un ambiente locale progettato per potenziare i modelli di intelligenza artificiale (LLM) attraverso l'integrazione di strumenti, memorie e protocolli di contesto. L'obiettivo è centralizzare la gestione degli agenti AI, fornendo loro un set di strumenti estensibile e una memoria persistente, il tutto gestito tramite un'interfaccia web intuitiva.

## 🎯 Obiettivi del Progetto
- **Local-First:** Esecuzione di modelli locali (tramite Ollama, LocalAI o simili).
- **Centralizzazione:** Database SQLite unico per configurazioni, memorie, log e prompt.
- **Scalabilità:** Architettura modulare a plugin per aggiungere nuovi strumenti senza riscrivere il core.
- **Interfaccia Visuale:** Dashboard web per monitorare e configurare l'ambiente.
- **Supporto MCP:** Integrazione nativa del Model Context Protocol.

## 🏗️ Architettura Proposta

### Backend (Python/FastAPI)
Ho scelto Python per la sua vasta libreria di integrazioni AI (LangChain, LlamaIndex, Ollama-python).
- **Core Engine:** Gestisce il ciclo di vita delle richieste e l'orchestrazione dei tool.
- **Tool Registry:** Un sistema dinamico dove ogni nuovo tool viene registrato e reso disponibile ai modelli.
- **Database Layer:** SQLAlchemy/SQLModel con SQLite per la persistenza.

### Frontend (React + Tailwind)
Un'interfaccia moderna per gestire:
- Configurazione dei Modelli.
- Editor di Prompt con versioning.
- Esploratore della Memoria (Vettoriale e Relazionale).
- Logs delle interazioni in tempo reale.

### Database Schema (SQLite)
- `models`: Configurazione dei modelli locali disponibili.
- `prompts`: Libreria di prompt di sistema e template.
- `memories`: Memoria a lungo termine (con supporto a embedding via SQLite-vss).
- `tools`: Configurazione e permessi degli strumenti abilitati.
- `conversations`: Storico delle chat e degli input/output degli strumenti.

## 🛠️ Proposte di Strumenti (Tools) per gli LLM

Per rendere Efesto veramente utile, ecco alcuni strumenti che i modelli potranno utilizzare:

1.  **File System Tool:** Leggere/Scrivere file in directory sicure (sandbox).
2.  **MCP Connector:** Bridge verso server MCP esterni (Google Drive, GitHub, Slack).
3.  **Local Python Interpreter:** Esecuzione di script Python per calcoli complessi o analisi dati.
4.  **Web Search (Local):** Ricerca web tramite istanze locali di SearXNG.
5.  **Memory Search:** Accesso alla base di conoscenza personale salvata nel database.
6.  **Database Query Tool:** Capacità di interrogare tabelle specifiche di SQLite per estrarre dati strutturati.
7.  **Task Manager:** Creazione e gestione di TODO/Calendario locali.

## 📅 Roadmap di Sviluppo

### Fase 1: Fondamenta (Core & DB)
- [ ] Setup del progetto Python e database SQLite.
- [ ] Implementazione del Tool Registry di base.
- [ ] Integrazione iniziale con Ollama.

### Fase 2: Integrazione Strumenti & MCP
- [ ] Supporto per il protocollo MCP.
- [ ] Sviluppo dei primi 3 tool (File System, Python, Memory).
- [ ] Sistema di gestione dei prompt (CRUD).

### Fase 3: Interfaccia Web
- [ ] Sviluppo della Dashboard in React.
- [ ] Visualizzazione dei log e delle chiamate ai tool.
- [ ] Pannello di configurazione per i modelli.

### Fase 4: Memoria Avanzata
- [ ] Implementazione di RAG (Retrieval Augmented Generation) locale.
- [ ] Utilizzo di SQLite-vss per la ricerca vettoriale nella memoria.

---
*Efesto - Costruisci il tuo Olimpo Digitale.*


Per chiudere e riavviare l'applicazione, segui questi passaggi a seconda di come l'hai avviata:

  1. Come chiudere l'applicazione
  Se l'applicazione è in esecuzione nel tuo terminale, il comando standard per interromperla è:
   * Ctrl + C (sia per il backend che per il frontend).

  Se hai avviato i processi separatamente, dovrai farlo in entrambi i terminali.

  2. Come riavviarla
  Per far ripartire tutto, apri due terminali (o usa due tab) ed esegui:

  Per il Backend (Python/FastAPI):
   1 cd backend
   2 source venv/bin/activate
   3 uvicorn app.main:app --reload

  Per il Frontend (React/Vite):
   1 cd frontend
   2 npm run dev