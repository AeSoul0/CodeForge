Ecco un README professionale, moderno e completo, scritto apposta per il tuo nuovo brand **ÆSouls**. È progettato per fare un'ottima figura su GitHub e per spiegare esattamente l'architettura che hai costruito stasera.

---

# 🌌 ÆSouls - Full-Stack Portfolio Ecosystem

**ÆSouls** è un ecosistema digitale moderno costruito per mostrare progetti di sviluppo attraverso un'architettura full-stack robusta, veloce e tipizzata. Il progetto separa nettamente la logica di presentazione (Frontend) dalla gestione dei dati (Backend), garantendo scalabilità e performance elevate.

---

## 🛠️ Tech Stack

### **Frontend**

* **Framework:** [Astro](https://astro.build/) (v4+) - Scelto per le performance imbattibili e il rendering ottimizzato.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) - Utilizzato con motore Vite per un design fluido e ultra-moderno.
* **Language:** [TypeScript](https://www.google.com/search?q=https://www.typescript.org/) - Per un codice sicuro, auto-documentato e privo di errori di runtime.
* **Icons:** Supporto SVG/Favicon integrato.

### **Backend**

* **Runtime:** [Node.js]()
* **Framework:** [Fastify]() - "The fast and low overhead web framework".
* **Logging:** [Pino]() + `pino-pretty` - Sistema di log professionale con formattazione personalizzata in **GMT +2**.
* **Database:** [MongoDB Atlas]() - Database NoSQL su cloud per una persistenza dei dati flessibile.
* **ODM:** [Mongoose]() - Per la modellazione dei dati dei progetti.

---

## 📁 Struttura del Progetto

```text
ÆSouls/
├── backend/
│   ├── src/
│   │   ├── config/          # Connessione al Database (MongoDB)
│   │   ├── models/          # Schemi Mongoose (Project.js)
│   │   ├── routes/          # API Endpoints (Health, Projects)
│   │   └── index.js         # Entry point e configurazione Fastify
│   └── .env                 # Credenziali database (non versionato)
│
└── frontend/
    ├── public/              # Risorse statiche (Favicon, immagini)
    ├── src/
    │   ├── pages/           # Rotte Astro (index.astro)
    │   └── styles/          # CSS globale e Tailwind v4
    └── astro.config.mjs     # Configurazione Astro & Vite

```

---

## 🚀 Funzionalità Principali

1. **Logging Avanzato:** Il backend utilizza un logger personalizzato che monitora ogni richiesta con timestamp precisi sincronizzati sull'orario italiano (**GMT +2**).
2. **API RESTful:** Endpoints pronti per operazioni CRUD (Create, Read) sui progetti.
3. **Database Cloud:** Integrazione nativa con MongoDB Atlas per gestire i contenuti in tempo reale.
4. **UI Dark Mode:** Interfaccia ispirata all'estetica "Midnight High-Tech", ottimizzata per sviluppatori e recruiter.
5. **Type Safety:** Uso rigoroso di Interfacce TypeScript nel frontend per la gestione dei dati provenienti dalle API.

---

## 🚦 Come Iniziare

### 1. Requisiti

* Node.js installato.
* Un cluster MongoDB attivo (Atlas).

### 2. Configurazione Backend

Entra nella cartella backend e installa le dipendenze:

```bash
cd backend
npm install

```

Crea un file `.env` con la tua stringa di connessione:

```env
MONGO_URI=mongodb+srv://tuo_utente:tua_password@cluster.mongodb.net/aesouls

```

Avvia il server:

```bash
npm run dev

```

### 3. Configurazione Frontend

Entra nella cartella frontend e installa le dipendenze:

```bash
cd frontend
npm install

```

Avvia il sito:

```bash
npm run dev

```

---

## 📡 API Endpoints

| Metodo | Endpoint | Descrizione |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica lo stato di salute del server. |
| `GET` | `/api/projects` | Recupera tutti i progetti dal database. |
| `POST` | `/api/projects` | Carica un nuovo progetto nel portfolio. |

### Esempio di inserimento progetto (PowerShell):

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/projects" -Method Post -ContentType "application/json" -Body '{"titolo": "ÆSouls", "descrizione": "Portfolio Full-Stack", "tecnologie": ["Astro", "Fastify"]}'

```

---

## 🌙 Dedizione Notturna

Questo progetto è stato forgiato durante lunghe sessioni di coding notturno, con l'obiettivo di creare un prodotto che sia tanto bello nel codice quanto nell'interfaccia.

**ÆSouls** - *Costruire esperienze digitali, un commit alla volta.*

---

*Creato con ❤️ da Samuele (ÆSouls)*