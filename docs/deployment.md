# Deployment Guide

## Architecture
CodeForge is designed to be deployed using modern serverless and PaaS providers:
- **Frontend**: Vercel (using the `@astrojs/vercel` adapter)
- **Backend**: Render (Node.js web service)
- **Database**: MongoDB Atlas

## Frontend (Vercel)
1. Connect the GitHub repository to Vercel.
2. The Astro Vercel adapter is already configured in `astro.config.mjs`.
3. Set the following environment variables in the Vercel dashboard:
   - `PUBLIC_API_URL` (Point this to the Render backend URL, e.g., `https://codeforge-ukq5.onrender.com`)
4. Vercel will automatically build and deploy on push.

## Backend (Render)
1. Create a new Web Service on Render and connect the repository.
2. Set the root directory to `backend`.
3. Set the Build Command to `npm install && npm run build`.
4. Set the Start Command to `npm start`.
5. Add the necessary environment variables in the Render dashboard:
   - `MONGODB_URI` (from MongoDB Atlas)
   - `JWT_SECRET` (generate a secure random string)
   - `PORT` (Render handles this automatically, usually 10000)
   - `FRONTEND_URL` (Point to your Vercel URL for CORS)
   - `ADMIN_API_KEY` (Strong secret used to sync the admin password)

## Production Considerations
- Ensure `.env` is never committed to the repository (already handled via `.gitignore`).
- Render spins down on the free tier after inactivity; hitting the backend may take a few seconds on the first request.
- Ensure the MongoDB Atlas Network Access is configured to allow connections from Render (or set to `0.0.0.0/0` if using dynamic IPs).
