# Nexus

Nexus is a high-energy, real-time multiplayer platform designed for friends to hang out, chat, and play games together. It features a sleek, dark-themed glassmorphism UI with neon cyan and electric purple accents.

## Features

- **Guest Mode:** No signup required. Instantly create or join rooms using a magic code.
- **Real-time Presence & Chat:** Persistent chat sidebar and member presence using Supabase Realtime.
- **8 Built-in Activities:**
  - 🎨 **Whiteboard:** Collaborative freehand drawing with multi-color brushes.
  - ✏️ **Pictionary:** Draw-and-guess game with 5 rounds and a 60s timer.
  - 🟩 **Word Guess:** A shared multiplayer Wordle clone with live sync.
  - 🧠 **Trivia:** 10 fast-paced timed questions.
  - 🍿 **Watch Party:** Synchronized YouTube video playback with a shared queue.
  - ❌ **Tic Tac Toe:** Classic 2-player with spectator support.
  - ♟️ **Chess:** 2-player chess with full legal move validation.
  - ✊ **Rock Paper Scissors:** Best of 5 simultaneous reveal matches.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS v4, Lucide React (SVG icons)
- **Backend & Sync:** Supabase (Auth & Realtime Channels)
- **Styling:** Custom CSS variables & glassmorphism utilities (`@theme`)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

Deploy seamlessly to [Vercel](https://vercel.com/new). The GitHub Actions CI workflow automatically checks that the project builds successfully on every pull request.
