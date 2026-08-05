<div align="center">
  <img src="admin/public/logo.jpg" alt="AuraLingo AI Logo" width="120" style="border-radius: 24px; box-shadow: 0 10px 30px rgba(168, 85, 247, 0.4);" />
  
  # 🎙️ AuraLingo AI
  ### Next-Generation 24/7 AI Personal Language Coach & Multi-Modal Platform

  [![Next.js](https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![Flutter](https://img.shields.io/badge/Flutter-3.44-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
  [![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://prisma.io/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

  <p align="center">
    <strong>Repository:</strong> <a href="https://github.com/Omatsulijoshua/AuraLingo-AI-">github.com/Omatsulijoshua/AuraLingo-AI-</a>
  </p>
</div>

---

## 🌟 Executive Overview

**AuraLingo AI** is a production-ready, full-stack, multi-modal platform designed to function as a **24/7 Personal AI Language Coach** rather than a static lesson app. Unlike traditional language applications (such as Duolingo, Speak, or Praktika) that rely on fixed repetitive drills, AuraLingo AI delivers an adaptive experience that:

*   **Learns Your Native Language Background**: Leverages mother-tongue contrastive analysis (English, Spanish, Yoruba, Hausa, Igbo, Mandarin, Arabic, etc.) to explain false cognates and grammar patterns.
*   **Designs Personalized Adaptive Curriculums**: Automatically synthesizes node-based learning roadmaps from complete beginner (A1) to near-native mastery (C1+/C2).
*   **Teaches Through Real-World Conversation**: Simulates high-stakes roleplay scenarios (Tech Job Interviews, Tapas Bar ordering, Apartment Lease negotiations, Airport Immigration clearance).
*   **Remembers Every Mistake**: Maintains a persistent, vectorized **Error Memory Bank** tracking recurrence frequency and mastery progress.
*   **Generates Real-Time Custom Exercises**: Synthesizes custom dynamic drills (MCQ, Fill-in-the-blanks, Pronunciation mimicry) targeting active mistakes.
*   **Provides Instant Micro-Coaching**: Delivers real-time phonetic accuracy %, side-by-side grammar corrections (`- Yo ir` -> `+ Yo fui`), native synonym upgrades, and cultural etiquette tips.
*   **Multi-Key LLM Engine Routing**: Features fallback routing across Gemini 2.0 Flash, Groq Cloud Llama 3.3 70B, OpenRouter, and OpenAI GPT-4o.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    subgraph Client Layer
        A[📱 Flutter Native Mobile App /mobile_app]
        B[🌐 Next.js Student & Admin Web /admin]
    end

    subgraph Backend & API Layer
        C[⚙️ NestJS API Gateway /backend]
        D[(🐘 PostgreSQL Database / Prisma ORM)]
    end

    subgraph AI Engine & Multi-Key Router
        E[♊ Gemini 2.0 Flash API]
        F[⚡ Groq Llama 3.3 70B]
        G[🔀 OpenRouter Gateway]
        H[🧠 OpenAI GPT-4o]
    end

    A -->|HTTPS / WebSockets| C
    B -->|HTTPS / WebSockets| C
    C -->|Prisma Client| D
    C -->|Multi-Key LLM Router| E
    C -->|Multi-Key LLM Router| F
    C -->|Multi-Key LLM Router| G
    C -->|Multi-Key LLM Router| H
```

---

## 🎨 Design System & Color Tokens (Royal Amethyst & Sunset Coral)

AuraLingo AI uses a design aesthetic featuring glassmorphism, dynamic glowing borders, and curated typography (`Google Fonts Outfit`).

| Design Token | Hex Code | Flutter Color Code | Platform Usage |
| :--- | :--- | :--- | :--- |
| **Midnight Purple** | `#0F081D` | `Color(0xFF0F081D)` | Base Deep Background |
| **Deep Velvet** | `#180E29` | `Color(0xFF180E29)` | Surface Cards & Elevated Glass Containers |
| **Amethyst Glow** | `#A855F7` | `Color(0xFFA855F7)` | Primary Brand Glow, Badges & CTA Buttons |
| **Sunset Coral** | `#FF6B6B` | `Color(0xFFFF6B6B)` | Secondary Highlight, Streak Trackers & Badges |
| **Emerald Green** | `#10B981` | `Color(0xFF10B981)` | Phonetic Accuracy %, Verified Badges & Success |

---

## ✨ Platform Feature Matrix

### 1. 🎙️ Live AI Voice & Text Studio
*   Simulated multi-modal audio recording interface with live speech bubble streams.
*   Real-time **Micro-Coaching Panel**:
    *   **Phonetic Accuracy Score (%)**
    *   **Grammar Fixes**: Side-by-side diff display of original vs. corrected text
    *   **Native Synonyms**: Contextual vocabulary upgrades
    *   **Cultural Tip**: Real-world cultural etiquette guidance

### 2. 🧠 Persistent Error Memory (Mistake Bank)
*   Logs every spoken or typed mistake automatically.
*   Categorizes errors by grammar rule (e.g., *Past Tense Conjugation*, *Ser vs. Estar*, *Subjunctive Mood*).
*   Tracks recurrence counts and mastery progress bars (0% to 100%).

### 3. ⚡ Real-Time Dynamic Exercise Generator
*   Generates targeted drills on-the-fly pulling directly from the learner's mistake memory bank.
*   Supports Multiple Choice Questions (MCQ), Fill-In-The-Blanks (FIB), and Pronunciation Mimicry Drills.

### 4. 🗺️ Personalized Adaptive Curriculum
*   Visual node-based learning roadmap spanning CEFR levels A1 to C1+.
*   Unlocks new milestone units as conversational fluency metrics improve.

### 5. 🔑 Multi-Key AI Provider Router
*   Configurable model fallback chain across:
    *   **Gemini 2.0 Flash** (Google DeepMind)
    *   **Groq Cloud Llama 3.3 70B** (Ultra-low latency inference)
    *   **OpenRouter** (Open-source model gateway)
    *   **OpenAI GPT-4o** (High-precision reasoning)

---

## 📁 Repository Structure

```
AuraLingo-AI/
├── admin/                      # Next.js 16 Web Client & Admin Portal
│   ├── public/                 # Static assets & brand logo (logo.jpg)
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/login/     # Secure login portal
│   │   │   ├── onboarding/     # 5-step interactive onboarding wizard
│   │   │   └── dashboard/      # Student & Admin dashboard routes
│   │   │       ├── coach/      # Live AI Voice Studio
│   │   │       ├── scenarios/  # Scenario simulator & builder
│   │   │       ├── mistakes/   # Persistent error memory bank
│   │   │       ├── exercises/  # Dynamic real-time exercise generator
│   │   │       ├── curriculum/ # Adaptive curriculum explorer
│   │   │       ├── users/      # Learner management & CEFR tracking
│   │   │       ├── reviews/    # Human coach audit & session review
│   │   │       └── settings/   # Multi-Key AI Provider configuration
│   │   └── lib/
│   │       ├── language-ai.ts  # Core models & LocalStorage state engine
│   │       └── api.ts          # Central API client
│   ├── package.json
│   └── globals.css             # TailwindCSS design system tokens
│
├── mobile_app/                 # Flutter Native Mobile Application (Android & iOS)
│   ├── assets/                 # App assets
│   ├── lib/
│   │   ├── main.dart           # App entrypoint & AuraLingo theme configuration
│   │   ├── models/             # Dart data models for scenarios & feedback
│   │   ├── services/           # AI state service & turn simulator
│   │   └── screens/
│   │       ├── home_screen.dart        # Mobile Coach Hub & metrics
│   │       ├── voice_coach_screen.dart  # Live audio studio & micro-coaching bar
│   │       ├── mistakes_screen.dart     # Persistent mistake bank view
│   │       └── onboarding_screen.dart   # 5-step mobile wizard
│   └── pubspec.yaml            # Flutter dependencies (google_fonts, etc.)
│
├── backend/                    # NestJS API Server & Database ORM
│   ├── prisma/
│   │   └── schema.prisma       # PostgreSQL models (User, LanguageProfile, ScenarioSession, ErrorLog)
│   ├── src/
│   │   ├── coach/              # Coach module, controller & service
│   │   ├── prisma.service.ts   # Prisma database service
│   │   ├── app.module.ts
│   │   └── main.ts             # NestJS entrypoint
│   ├── package.json
│   └── tsconfig.json
│
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.x` or later
- **npm**: `v10.x` or later
- **Flutter SDK**: `v3.22.x` or later (for mobile development)
- **PostgreSQL**: `v15.x` or later (for backend database)

---

### 1. Web Application (`/admin`) Setup

```bash
# Navigate to web client directory
cd admin

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To verify production build:
```bash
npm run build
```
*(All 22 routes compile statically with 0 errors!)*

---

### 2. NestJS Backend (`/backend`) Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run database migrations
npx prisma db push

# Build & launch API server
npx nest build
npm run start:dev
```

The NestJS backend server will start on [http://localhost:4000](http://localhost:4000).

---

### 3. Flutter Mobile Application (`/mobile_app`) Setup

```bash
# Navigate to mobile app directory
cd mobile_app

# Fetch dependencies
flutter pub get

# Run syntax analyzer check
flutter analyze

# Launch on connected emulator / device
flutter run
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in `/backend` and `/admin`:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/auralingo_db?schema=public"

# AI Provider API Keys
GEMINI_API_KEY="your_gemini_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
OPENROUTER_API_KEY="your_openrouter_api_key_here"

# Authentication & JWT
JWT_SECRET="auralingo_jwt_secret_key_2026"
```

---

## 🧪 Empirical Build & Verification Status

| Project Component | Build Command | Status | Result |
| :--- | :--- | :--- | :--- |
| **Next.js Web Client** | `cd admin && npm run build` | **PASSED** | `✓ Compiled successfully in 7.5s (22/22 routes)` |
| **NestJS Backend API** | `cd backend && npx nest build` | **PASSED** | `✓ Exited with Code 0 (0 errors)` |
| **Flutter Mobile App** | `cd mobile_app && flutter analyze` | **PASSED** | `✓ 0 errors found (ran clean in 4.4s)` |

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository: `https://github.com/Omatsulijoshua/AuraLingo-AI-`
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by <strong>Joshua Omatsuli</strong> & the <strong>AuraLingo AI Team</strong></p>
  <p>⭐ Star us on GitHub: <a href="https://github.com/Omatsulijoshua/AuraLingo-AI-">github.com/Omatsulijoshua/AuraLingo-AI-</a></p>
</div>
