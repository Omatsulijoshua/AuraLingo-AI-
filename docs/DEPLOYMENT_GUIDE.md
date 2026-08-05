# 🚀 AuraLingo AI — Complete Production Deployment Guide

This guide walks you through deploying the full-stack **AuraLingo AI** platform (Web Client, NestJS Backend API, PostgreSQL Database, and Flutter Mobile App) to production cloud environments for $0/mo using free tiers.

---

## 🏗️ Production Architecture Overview

```mermaid
graph TD
    A[📱 Mobile App - Android / iOS / Web] -->|API Requests| C[⚙️ Render.com NestJS Backend]
    B[🌐 Vercel.com Next.js Web App /admin] -->|API Requests| C
    C -->|Prisma ORM| D[(🐘 Neon.tech PostgreSQL Database)]
    C -->|Multi-Key LLM Router| E[AI Providers: Gemini / Groq / OpenAI]
```

---

## 🌐 Step 1: Deploy Web Client to Vercel (Next.js)

1. Log in to [Vercel.com](https://vercel.com) with your GitHub account.
2. Click **Add New** → **Project**.
3. Select your GitHub repository: `Omatsulijoshua/AuraLingo-AI-`.
4. Configure Project Settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `admin`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click **Deploy**. Vercel will generate your live production URL (e.g. `https://auralingo-ai.vercel.app`).

---

## 🐘 Step 2: Provision Free PostgreSQL Database (Neon.tech)

1. Create a free account at [Neon.tech](https://neon.tech).
2. Click **Create Project** and name it `auralingo-db`.
3. Copy your Pooled PostgreSQL Connection String (`DATABASE_URL`):
   ```env
   postgresql://alex:password@ep-cool-pool-1234.us-east-2.aws.neon.tech/auralingo?sslmode=require
   ```

---

## ⚙️ Step 3: Deploy NestJS Backend to Render.com

1. Log in to [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `Omatsulijoshua/AuraLingo-AI-`.
4. Configure Web Service:
   - **Name**: `auralingo-api`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx nest build`
   - **Start Command**: `npm run start:prod`
5. Add Environment Variables under **Environment**:
   - `DATABASE_URL` = *(Your Neon.tech Connection String)*
   - `GEMINI_API_KEY` = *(Your Google AI Studio Key)*
   - `GROQ_API_KEY` = *(Your Groq Cloud Key)*
   - `JWT_SECRET` = `auralingo_production_jwt_secret_2026`
6. Click **Create Web Service**.
7. In your local terminal, apply database schemas to production:
   ```bash
   cd backend
   npx prisma db push
   ```

---

## 📱 Step 4: Build Flutter Mobile App (Android APK / iOS)

### Build Android APK:
```bash
cd mobile_app
flutter build apk --release
```
The production APK will be generated at `mobile_app/build/app/outputs/flutter-apk/app-release.apk`.

### Build Flutter Web Version:
```bash
cd mobile_app
flutter build web --release
```
Deploy the contents of `mobile_app/build/web/` to Vercel, Netlify, or Firebase Hosting.

---

## ✅ Post-Deployment Checklist

- [ ] Verify Web client reaches production URL on Vercel.
- [ ] Test Onboarding Wizard (`/onboarding`) and AI Coach Hub (`/dashboard`).
- [ ] Test live AI turn requests to NestJS Backend on Render.
- [ ] Verify Prisma database connectivity with Neon PostgreSQL.
- [ ] Verify 0-cost Web Speech API audio recording & playback.
