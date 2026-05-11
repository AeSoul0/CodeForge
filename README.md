# 🚀 CodeForge | Portfolio Ecosystem

**CodeForge** è un ecosistema digitale moderno e performante sviluppato da **Samuele Arabia**. Il progetto è composto da un frontend ultra-veloce realizzato con Astro e un backend robusto basato su Fastify, progettato per gestire e visualizzare una collezione dinamica di progetti tecnologici.

---

## 🛠️ Stack Tecnologico

### Frontend
- **Framework:** [Astro 6.3.1](https://astro.build/) (Islands Architecture per performance massime).
- **UI Library:** [React 19.2.6](https://react.dev/) per la gestione di componenti interattivi.
- **Styling:** [Tailwind CSS 4.2.4](https://tailwindcss.com/) per un design responsivo e moderno.
- **Features:** Glassmorphism UI, animazioni particellari interattive via Canvas API e scroll fluido.

### Backend
- **Runtime:** Node.js (>=22.12.0).
- **Framework:** [Fastify 5.8.5](https://www.fastify.io/) (estremamente veloce e leggero).
- **Database:** [MongoDB](https://www.mongodb.com/) tramite **Mongoose 9.6.2**.
- **Logging:** [Pino-pretty 13.1.3](https://github.com/pinojs/pino-pretty) per log di sistema chiari e leggibili.

---

## ✨ Caratteristiche Principali

- **Design Premium:** Interfaccia basata su *Glassmorphism* (effetto vetro smerigliato) con bordi illuminati e hover glow.
- **Sfondo Interattivo:** Sistema di particelle animato in JavaScript puro che reagisce al movimento del mouse.
- **Sincronizzazione Real-time:** Il portfolio interroga dinamicamente il database MongoDB per mostrare i progetti aggiornati.
- **Architettura Professionale:** Separazione netta tra logica di business (backend) e interfaccia utente (frontend).
- **SEO & Performance:** Ottimizzato grazie alle capacità di rendering statico di Astro.

---

## 📂 Struttura del Progetto

```text
AeSouls-CodeForge/
├── frontend/           # Codice sorgente Astro & React
│   ├── src/pages/      # Route principali (index.astro)
│   └── src/components/ # Componenti UI riutilizzabili
├── backend/            # API REST con Fastify
│   ├── src/models/     # Schemi Mongoose (es. Projects.js)
│   ├── src/routes/     # Definizione degli endpoint API
│   └── src/index.js    # Entry point del server
└── package.json        # Gestione dipendenze globale
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

© 2026 ÆSouls
