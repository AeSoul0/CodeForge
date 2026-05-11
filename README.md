# 🚀 CodeForge | Portfolio Ecosystem

**CodeForge** is a modern, high-performance digital ecosystem developed by **Samuele Arabia**. The project consists of an ultra-fast frontend built with Astro and a robust backend powered by Fastify, designed to manage and showcase a dynamic collection of technological projects.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Astro 6.3.1](https://astro.build/) (utilizing Islands Architecture for maximum performance).
- **UI Library:** [React 19.2.6](https://react.dev/) for interactive components.
- **Styling:** [Tailwind CSS 4.2.4](https://tailwindcss.com/) for a modern, responsive design.
- **Features:** Glassmorphism UI, interactive particle animations via Canvas API, and smooth scrolling.

### Backend
- **Runtime:** Node.js (>=22.12.0).
- **Framework:** [Fastify 5.8.5](https://www.fastify.io/) (extremely fast and lightweight).
- **Database:** [MongoDB](https://www.mongodb.com/) via **Mongoose 9.6.2**.
- **Logging:** [Pino-pretty 13.1.3](https://github.com/pinojs/pino-pretty) for clear, readable system logs.

---

## ✨ Key Features

- **Premium Design:** A "Midnight High-Tech" interface based on *Glassmorphism* (frosted glass effect) with illuminated borders and hover glow effects.
- **Interactive Background:** A custom JavaScript particle system that reacts to mouse movements.
- **Real-time Synchronization:** The portfolio dynamically fetches data from a MongoDB database to display up-to-date projects.
- **Professional Architecture:** Clean separation between business logic (backend) and user interface (frontend).
- **SEO & Performance:** Optimized using Astro's static rendering capabilities.

---

## 📂 Project Structure

```text
AeSouls-CodeForge/
├── frontend/           # Astro & React source code
│   ├── src/pages/      # Main routes (index.astro)
│   └── src/components/ # Reusable UI components
├── backend/            # REST API with Fastify
│   ├── src/models/     # Mongoose schemas (e.g., Projects.js)
│   ├── src/routes/     # API endpoint definitions
│   └── src/index.js    # Server entry point
└── package.json        # Global dependency management

```

---

## 🚀 Getting Started

### 1. Prerequisites

* Node.js installed.
* An active MongoDB cluster (e.g., MongoDB Atlas).

### 2. Backend Configuration

Navigate to the `backend` folder and install dependencies:

```bash
cd backend
npm install

```

Create a `.env` file with your connection string:

```env
MONGO_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/aesouls

```

Start the server:

```bash
npm run dev

```

### 3. Frontend Configuration

Navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install

```

Start the development site:

```bash
npm run dev

```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check the server health status. |
| `GET` | `/api/projects` | Fetch all projects from the database. |
| `POST` | `/api/projects` | Upload a new project to the portfolio. |

### Example: Adding a Project (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/projects" -Method Post -ContentType "application/json" -Body '{"titolo": "ÆSouls", "descrizione": "Full-Stack Portfolio", "tecnologie": ["Astro", "Fastify"]}'

```

© 2026 ÆSouls


