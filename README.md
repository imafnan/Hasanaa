# Hasanaa E-Commerce Store

This repository contains the full-stack e-commerce application for **Hasanaa** — a traditional Islamic clothing brand. It consists of a customer-facing storefront and a full admin panel.

## Architecture

The project is structured as a clean, production-ready Full Stack codebase:

- `/frontend` — React + Vite storefront and admin panel, configured for deployment to **Vercel**.
- `/backend` — Express 5 API server with MongoDB/Mongoose, configured for deployment to **Render**.

---

## Local Development

To run the application locally, you will start the frontend and backend separately.

### 1. Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Copy `.env.example` to `.env` and fill in the values:
   ```bash
   cp .env.example .env
   ```
4. Start the development server (runs on `http://localhost:5000` by default):
   ```bash
   npm run dev
   ```
   > **Note**: During development, if no `MONGODB_URI` environment variable is detected, the server will automatically launch a persistent local in-process MongoDB instance stored in `backend/mongodb-data`.

### 2. Run the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## Database & Storage Configuration

### MongoDB

The backend connects to MongoDB using Mongoose. Set the `MONGODB_URI` environment variable in your production environment (e.g. Render Dashboard) to point to your hosted MongoDB instance.

### Image Storage

During development, uploaded files are stored locally inside `backend/uploads/`.
In production, you can switch the storage provider to **Cloudinary** by setting:
```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Deployment

### Backend (Render)

1. Deploy the `backend` folder to Render.
2. In the Render service dashboard:
   - Set **Root Directory** to `backend`.
   - Set **Build Command** to `npm install && npm run build`.
   - Set **Start Command** to `npm run start`.
   - Set necessary environment variables (`MONGODB_URI`, `CLOUDINARY_*`, etc.).

### Frontend (Vercel)

1. Deploy the `frontend` folder to Vercel.
2. In the Vercel project settings:
   - Set **Root Directory** to `frontend`.
   - The build command and output directory are automatically detected.
   - Set the `VITE_API_URL` environment variable if you want the frontend to query a custom backend endpoint directly (Vercel rewrite rules in `vercel.json` will also proxy `/api/*` to the default Render backend URL).

---

## Admin Panel Credentials

- **Admin URL**: `/admin/login`
- **Username**: `admin`
- **Password**: `hasanaa2024`
