# Deployment Guide - IELTS PrepPro (BandUp IELTS)

This guide walks you through deploying the complete BandUp IELTS stack to production platforms (Railway, Render, Vercel, and Neon/Supabase).

---

## 1. Production Database (PostgreSQL)

We recommend using **Neon.tech** or **Supabase** for a managed serverless PostgreSQL database.

1. Sign up on [Neon](https://neon.tech) or [Supabase](https://supabase.com).
2. Create a new database project named `bandup_ielts`.
3. Copy the Connection String. It should look like:
   `postgresql://username:password@ep-cool-feather-a5xxxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require`

---

## 2. Deploy API Server (NestJS)

We recommend **Railway** or **Render** for hosting the backend API.

### Option A: Railway (Recommended)
1. Go to [Railway.app](https://railway.app) and create a project.
2. Link your GitHub repository `Omatsulijoshua/BandUp-IELTS`.
3. Select the `/backend` subdirectory as the root.
4. Add the following **Environment Variables**:
   *   `DATABASE_URL`: *(Your Neon/Supabase connection string)*
   *   `JWT_SECRET`: *(A secure random string, e.g., `83b27cf...`)*
   *   `JWT_REFRESH_SECRET`: *(A secure random string)*
   *   `ENCRYPTION_KEY`: *(A 32-character hexadecimal key for API key storage)*
   *   `PORT`: `5000`
5. Railway will automatically build and deploy using the `package.json` in the `/backend` folder. It runs `npm run build` and starts the app.

### Option B: Render.com
1. Go to [Render](https://render.com) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Set the following details:
   *   **Root Directory**: `backend`
   *   **Build Command**: `npm install && npm run build`
   *   **Start Command**: `node dist/main`
4. Add the Environment Variables in the "Environment" tab.

### 🚀 Initialize Database in Production
Once the backend is live, run migrations to sync the production database structure:
```bash
# From your local terminal pointing to the production database:
DATABASE_URL="your-production-database-url" npx prisma migrate deploy
```

---

## 3. Deploy Marketing Website (Next.js)

We recommend **Vercel** for hosting the frontend application.

1. Go to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and select `Omatsulijoshua/BandUp-IELTS`.
3. Set the project configuration:
   *   **Project Name**: `bandup-website`
   *   **Framework Preset**: `Next.js`
   *   **Root Directory**: `website`
4. Add the **Environment Variables**:
   *   `NEXT_PUBLIC_API_URL`: `https://your-backend-railway-url.app/api`
5. Click **Deploy**. Vercel will build the website and serve it on a secure `https` subdomain.

---

## 4. Deploy Admin Dashboard (Next.js)

1. Go to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and select `Omatsulijoshua/BandUp-IELTS`.
3. Set the project configuration:
   *   **Project Name**: `bandup-admin`
   *   **Framework Preset**: `Next.js`
   *   **Root Directory**: `admin`
4. Add the **Environment Variables**:
   *   `NEXT_PUBLIC_API_URL`: `https://your-backend-railway-url.app/api`
5. Click **Deploy**.

---

## 5. Compile Flutter Mobile App (Android & iOS)

### Build Android Release APK
1. Open terminal inside `/mobile_app`.
2. Configure `/mobile_app/lib/services/api_service.dart` base URL to point to your live backend domain:
   ```dart
   final String baseUrl = "https://your-backend-railway-url.app/api";
   ```
3. Run the compiler:
   ```bash
   flutter build apk --release
   ```
4. Find the output APK ready for sharing or Play Store upload at:
   `/mobile_app/build/app/outputs/flutter-apk/app-release.apk`

### Build iOS Release App
1. Open the project in Xcode (macOS required).
2. Set up your signing certificates and profiles.
3. Run the compiler:
   ```bash
   flutter build ipa
   ```
