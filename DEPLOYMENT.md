# Deployment Guide

## 🖥️ Backend (Render)
1.  **Repository**: Connect your GitHub repo.
2.  **Root Directory**: `backend`
3.  **Build Command**: `npm install && npm run build`
4.  **Start Command**: `npm start`
5.  **Env Vars**:
    *   `MONGO_URI`: Your MongoDB Atlas URI.
    *   `JWT_SECRET`: A long random string.
    *   `FRONTEND_URL`: Your Vercel deployment URL (e.g., `https://papertradex.vercel.app`).

## 🎨 Frontend (Vercel)
1.  **Repository**: Connect your GitHub repo.
2.  **Root Directory**: `frontend`
3.  **Framework Preset**: Vite
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `dist`
6.  **Env Vars**:
    *   `VITE_API_URL`: Your Render backend URL (e.g., `https://papertradex-api.onrender.com`).

---
*Note: Deploy the Backend FIRST, then provide its URL to the Frontend.*
