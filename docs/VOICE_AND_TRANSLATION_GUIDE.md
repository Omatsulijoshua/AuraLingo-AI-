# AuraLingo AI — Voice & Translation Architecture Guide

This document clarifies whether **ElevenLabs** and **Google Translate** are needed for conversational voice roleplay in AuraLingo AI.

---

## 1. 🌐 Google Translate API — NOT NEEDED ❌

### **Why you DO NOT need Google Translate:**
1. **LLMs are Superior Translators for Language Learning**:
   - Google Translate translates literal words without understanding the student's learning context.
   - LLMs (**Gemini 2.0 Flash**, **Llama 3.3 70B**, **GPT-4o**) perform **Context-Aware Pragmatic Translation**. They translate whole phrases while explaining *why* a word was chosen, correcting past-tense mistakes, and offering native synonyms.

2. **Single API Call Efficiency**:
   - In AuraLingo AI, a single turn request to Gemini/Groq returns:
     ```json
     {
       "responseText": "¡Hola! ¿Qué te gustaría pedir hoy?",
       "translation": "Hello! What would you like to order today?",
       "phoneticScore": 92,
       "grammarCorrections": [
         { "original": "Yo ir", "corrected": "Yo fui", "explanation": "Use preterite 'fui' for completed past actions." }
       ],
       "culturalTip": "In Spain, 'pedir' is used when ordering food in restaurants."
     }
     ```
   - Running Google Translate separately adds unnecessary latency and extra costs.

---

## 2. 🎙️ ElevenLabs — OPTIONAL / ENHANCEMENT ⚡

### **Do you NEED ElevenLabs to start?**
**No.** AuraLingo AI works out-of-the-box using 0-cost built-in voice technologies.

### **Available Voice & Audio Options:**

| Option | Cost | Latency | Realism | Setup Required |
| :--- | :--- | :--- | :--- | :--- |
| **1. Web Speech API (Browser Native)** | **FREE ($0)** | ~0ms (Instant) | Medium | **Zero setup** (Built into Chrome, Safari, Edge, Android & iOS) |
| **2. Gemini 2.0 Native Audio** | **FREE / Low Cost** | ~200ms | High | Google AI Studio API Key |
| **3. ElevenLabs API** | $5 - $22 / mo | ~300ms | **Ultra-Realistic** (Human Clones) | ElevenLabs API Key |

### **Recommendation:**
* **Phase 1 (Production Launch)**: Use **Web Speech API** or **Gemini 2.0 Native Audio**. It costs $0 and provides instant voice output across all mobile devices and web browsers.
* **Phase 2 (Premium Tier Upgrade)**: Add **ElevenLabs** as an optional toggle for subscribers who want ultra-realistic voice cloning with regional accents (e.g., Madrid Spanish vs. Buenos Aires Spanish).

---

## 🚀 Summary Recommendation

- **Google Translate**: ❌ **Skip completely.** Let Gemini 2.0 / Llama 3.3 handle translation + grammar coaching in one call.
- **ElevenLabs**: ⚡ **Optional.** Start with Web Speech API ($0) and offer ElevenLabs for Pro subscribers later.
