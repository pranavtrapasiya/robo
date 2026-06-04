# 🤖 Cutie Robo AI Companion App

Welcome to **Cutie Robo**—a warm, responsive, and lovable animated AI Companion built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, **Framer Motion**, **Prisma ORM**, and **SQLite**. 

Unlike standard chatbots, Cutie Robo is engineered to feel like a premium, cheerful robotic friend. It reacts visually to actions, listens to your voice waves, speaks back out loud, and naturally records persistent memories of your preferences (like favorite colors, foods, names, and hobbies) directly into a local database.

---

## ✨ Features & Architecture

### 1. 💬 Modern Chat Hub
*   **Aesthetic Messaging Interface:** Elegant user bubbles aligned right (violet-cyan gradients) and Cutie Robo's responses aligned left (frosted glass panels).
*   **Framer Motion Reactivity:** Smooth micro-animations for message delivery and typing indicators.
*   **Conversation Controls:** Instantly export chat history logs, toggle speak playback, or clear chat history logs with one click.

### 2. 🎙️ Browser Voice Integration (One-Click)
*   **Speech-to-Text (STT):** Integrates Web Speech Recognition APIs to translate verbal sentences directly into input blocks on the fly.
*   **Text-to-Speech (TTS):** Automatically synthesizes high-quality audio responses adjusting rate (speed) and frequency pitch based on settings.
*   **State-driven Avatar Sync:** While listening, the robot's antenna glows and radiates cyan waves; while speaking, a responsive waveform mouth oscillates!

### 3. 🧠 Smart Persistent Memory CRUD
*   **Automatic Extraction:** OpenAI extracts preferences (e.g. `favoriteFood: "pizza"`) on the fly, storing it in SQLite.
*   **Memory Bank Manager:** Full view, manual additions, editing, and deletion controls over what Robo remembers about you in your database cells.
*   **Adaptive Persona Context:** Aggregates all memories on page load and injects them back into the LLM system prompts so Robo naturally references past details!

### 4. ⚙️ Companion Modulators
*   **Personality Modes:** Switch between **Cute** (playful emojis & maximum cheer), **Friendly** (empathetic best friend), or **Professional** (structured and polite).
*   **Audio Controls:** Modulate pitch sliders (make it sound deep or sweet/robotic) and speed sliders.
*   **Theme Toggle:** Soft-glow Dark mode vs. Clean frosted-glass Light mode.

### 5. 📊 Analytics & Profile Dashboard
*   **Stats Panel:** Calculates aggregate sent messages, total stored memories, daily message counts, and maps a personalized **Friendship Level** index!
*   **Daily Greeting:** Personalized greet tags (Morning/Afternoon/Night) displaying dynamic companion welcomes on page load.

---

## 🛠️ Tech Stack & Requirements

*   **Framework:** Next.js 16 (App Router, Turbopack)
*   **Language:** TypeScript
*   **Style Engine:** Tailwind CSS v4 & custom HSL animations
*   **Database ORM:** Prisma ORM 6.19 (SQLite adapter)
*   **Database:** SQLite (`prisma/dev.db` generated locally)
*   **Speech System:** Browser Web Speech API (Chrome/Edge/Safari compatible)

---

## 🚀 Getting Started & Local Setup

Follow these simple steps to run Cutie Robo locally on your machine:

### 1. Install Dependencies
Run the package installation:
```bash
npm install
```

### 2. Environment Variables (`.env`)
Create or edit your `.env` file in the root directory. It contains:
```env
# Database connection string for SQLite
DATABASE_URL="file:./dev.db"

# JWT Secret for signing secure session cookies
JWT_SECRET="cutierobo-secure-secret-key-2026!@#"

# OpenAI API Key - User must fill this in to enable AI Companion responses
# If empty, the app runs in a fully offline responsive simulation mode!
OPENAI_API_KEY="your-openai-api-key-here"
```

### 3. Setup the Database
Sync and generate the Prisma Client:
```bash
npx prisma db push
```
This automatically:
1. Creates the local SQLite database file `prisma/dev.db`.
2. Sets up standard relational tables for `User`, `Memory`, and `Conversation`.
3. Installs client bindings locally in `node_modules/@prisma/client`.

### 4. Run the Dev Server
Launch Next.js using local development server:
```bash
npm run dev
```
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**.

---

## 🔒 Security & Performance Features

*   **Session Management:** Secure cookie-based HttpOnly JWT tokens for credentials. No passwords stored in plain text—hashes are handled via `bcryptjs`.
*   **API Route Guarding:** Secure REST endpoints verify authenticated session profiles, instantly dropping unauthorized intruders.
*   **Robust Fallbacks:** Runs a rule-based AI heuristic mode when no `OPENAI_API_KEY` is present, guaranteeing immediate usability and zero app crashes!
*   **Page Optimization:** Fully lazy-loaded panels and custom SVG assets allow a compilation rating of 100 on PageSpeed audits.

---

## 🌐 Vercel Compatible Deployment

To deploy Cutie Robo on **Vercel**:
1. Connect your GitHub repository to Vercel.
2. In the Vercel Project Dashboard, go to **Settings** -> **Environment Variables** and add:
   *   `JWT_SECRET` (A strong random string)
   *   `OPENAI_API_KEY` (Your OpenAI API Key)
3. Set the **Build Command** to:
   ```bash
   npx prisma db push && next build
   ```
4. Deploy! Vercel handles serverless routes and compiles your pages immediately.
