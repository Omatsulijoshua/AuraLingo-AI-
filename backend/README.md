# AuraLingo AI Backend API Server

NestJS v11 backend API server with PostgreSQL Prisma ORM integration, providing endpoints for profile onboarding, AI multi-key routing, live voice scenario turns, persistent error memory, and dynamic exercise generation.

## 🚀 Quick Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Push**:
   ```bash
   npx prisma db push
   ```

3. **Build & Start API Server**:
   ```bash
   npx nest build
   npm run start:dev
   ```

The backend server listens on `http://localhost:4000/api`.

## 📌 Main API Endpoints

* `POST /api/coach/onboard`: Saves student language target, native background, CEFR level, and goal profile.
* `POST /api/coach/turn`: Processes user voice/text input turn, generates AI persona response, and extracts micro-coaching feedback.
* `GET /api/coach/mistakes`: Fetches active mistake bank records.
* `POST /api/coach/exercises`: Synthesizes real-time practice exercises.
