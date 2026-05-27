# 🚀 CodeForge | Portfolio Ecosystem

**CodeForge** is a modern, high-performance digital ecosystem developed by [AeSoul]. It features an ultra-fast frontend built with Astro and a robust backend powered by Fastify, designed to seamlessly manage and showcase a dynamic collection of technological projects.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Astro 6.3.1](https://astro.build/) (utilizing Islands Architecture for maximum performance).
- **UI Library:** [React 19.2.6](https://react.dev/) for interactive components.
- **Styling:** [Tailwind CSS 4.2.4](https://tailwindcss.com/) for a modern, responsive design.
- **Language:** TypeScript/JavaScript integration.
- **Features:** Glassmorphism UI, interactive particle animations via Canvas API, and smooth scrolling.

### Backend
- **Runtime:** Node.js (>= 22.12.0).
- **Framework:** [Fastify 5.8.5](https://www.fastify.io/) (extremely fast and lightweight).
- **Database:** [MongoDB](https://www.mongodb.com/) via **Mongoose 9.6.2**.
- **Logging:** [Pino-pretty 13.1.3](https://github.com/pinojs/pino-pretty) for clear, readable system logs.

---

## ✨ Key Features

- **Premium Design:** A "Midnight High-Tech" interface based on *Glassmorphism* (frosted glass effect) with illuminated borders and hover glow effects.
- **Interactive Background:** A custom JavaScript particle system that reacts to mouse movements.
- **Real-time Synchronization:** The portfolio dynamically fetches data from a MongoDB database to display up-to-date projects.
- **Professional Architecture:** Clean separation between business logic (backend) and user interface (frontend), complete with API proxying/routing.
- **Unified Development Server:** Run both the Astro frontend and the Fastify backend simultaneously with a single root command.

---

## 📂 Project Structure

```text
AeSouls-CodeForge/
├── frontend/             # Astro & React source code
│   ├── src/pages/        # Main Astro routes
│   │   ├── api/          # Astro server-side API routes (e.g., health.ts)
│   │   └── index.astro   # Main landing page
│   ├── src/components/   # Reusable UI components (e.g., TestBackend.jsx)
│   └── src/styles/       # Global styling (e.g., global.css)
├── backend/              # REST API with Fastify
│   ├── src/config/       # Database and server configs (e.g., db.js)
│   ├── src/models/       # Mongoose schemas (e.g., Projects.js)
│   ├── src/routes/       # API endpoints (e.g., health.js, projectRoutes.js)
│   └── src/index.js      # Server entry point
└── package.json          # Global dependency & script management (concurrently)

```

---

## 🚀 Quick Start

### 1. Prerequisites

* **Node.js** v22.12.0 or higher
* An active **MongoDB** cluster (e.g., MongoDB Atlas)

### 2. Installation

Clone the repository and install the dependencies for the root, backend, and frontend environments:

```bash
# Clone the repository
git clone [https://github.com/AeSouls/CodeForge.git](https://github.com/AeSouls/CodeForge.git)
cd CodeForge

# Install root dependencies (concurrently)
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..

```

### 3. Environment Configuration

Create a `.env` file inside the `backend` folder with your MongoDB connection string:

```env
# backend/.env
MONGO_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/aesouls

```

### 4. Run the Ecosystem

You don't need to start the servers separately. Thanks to the root configuration, you can launch both the frontend and the backend simultaneously from the root directory:

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

*(Note: The Astro frontend also includes a dedicated route at `frontend/src/pages/api/health.ts` for localized health checks or SSR capabilities).*

### Example: Adding a Project (PowerShell)

```powershell
Invoke-RestMethod -Uri "http://localhost:3002/api/projects" -Method Post -ContentType "application/json" -Body '{"titolo": "ÆSouls", "descrizione": "Full-Stack Portfolio", "tecnologie": ["Astro", "Fastify"]}'

```

© 2026 ÆSoul
