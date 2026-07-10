# BandUp IELTS PrepPro (IELTS PrepPro)

BandUp IELTS is a production-ready, premium IELTS preparation platform helping students prepare for both **IELTS Academic** and **IELTS General Training** exams. It features automated AI grading, timed mock exams, study streak trackers, personalized tutor feedback overrides, and subscription plans.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    A[Flutter Mobile App] -->|HTTPS / JWT| C[NestJS API Server]
    B[Next.js Student & Landing Web] -->|HTTPS / JWT| C
    D[Next.js Admin & Tutor Panel] -->|HTTPS / JWT| C
    C -->|Prisma ORM| E[(PostgreSQL Database)]
    C -->|Secure Integration| F[AI Models: OpenAI / Gemini / Ollama]
```

---

## 📁 Project Structure

*   `/backend`: NestJS Server with Prisma and PostgreSQL.
*   `/admin`: Next.js Admin & Tutor dashboard.
*   `/website`: Next.js Marketing Landing page & Student dashboard.
*   `/mobile_app`: Flutter native application (Android & iOS).
*   `/docs`: Architecture diagrams and database schemas.

---

## 🚀 Getting Started

### 1. Database Setup
1. Ensure a local PostgreSQL server is running.
2. Edit `/backend/.env` to configure your connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/bandup_ielts?schema=public"
   ```
3. Run migrations and seed database:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npm run seed
   ```

### 2. Run API Server (NestJS)
```bash
cd backend
npm install
npm run start:dev
```
The server will start at `http://localhost:5000/api`.

### 3. Run Web Dashboard (Next.js Student / Landing)
```bash
cd website
npm install
npm run dev
```
Open `http://localhost:3000` to view the landing website.

### 4. Run Admin & Tutor Panel (Next.js)
```bash
cd admin
npm install
npm run dev
```
Open `http://localhost:3001` to view the administration panel.

### 5. Run Mobile Application (Flutter)
Ensure you have the Flutter SDK installed and emulator running:
```bash
cd mobile_app
flutter pub get
flutter run
```

---

## 🔑 Default Test Accounts (Seeded)

*   **Super Admin**: `admin@bandup.com` / `admin123`
*   **Tutor / Examiner**: `tutor@bandup.com` / `tutor123`
*   **Student**: `student@bandup.com` / `student123`

---

## 🌟 Key Platform Features & Updates

*   **🇳🇬 Naira Currency Transition**: 100% localization from USD ($) to Nigerian Naira (₦) across landing pages, backend database models, payment records, and referral calculations.
*   **⚡ Groq Cloud Integration (`console.groq.com`)**: Integrated Groq API using the ultra-fast Llama 3.3 70B Versatile model for speaking and writing evaluations.
*   **📅 Daily Question Auto-Scheduler**: Background task that automatically seeds 20 questions daily (balanced across Listening, Reading, Writing, and Speaking) up to a maximum database limit of 1,000 questions.
*   **📊 Student Limits & Usage Tracker**: Dynamic progress bars on the student dashboard displaying daily question usage and remaining mock tests.
*   **💳 Admin Subscription Upgrader**: Interactive plan selectors directly within the Admin Users list to grant, modify, or revoke student subscription privileges in one click.
*   **🎨 Custom App Icon & release APK**: Re-branded native app icons with the custom gold logo and built the final release APK.

---

## 🔍 Validation Commands

To verify that all components are syntax-error free and build correctly:

*   **Backend**: `cd backend && npm run build`
*   **Website**: `cd website && npm run build`
*   **Admin**: `cd admin && npm run build`
*   **Mobile App**: `cd mobile_app && flutter analyze`
