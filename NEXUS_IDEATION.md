# Nexus – Product Ideation & Engineering Roadmap
> Real-time collaborative hangout platform featuring shared whiteboards, synchronized media, casual multiplayer games, and persistent room state.

---

## Table of Contents
1. [Executive Summary & Architecture](#1-executive-summary--architecture)
2. [Core Platform Experience](#2-core-platform-experience)
3. [Enriching Activities & Modules](#3-enriching-activities--modules)
4. [Social & Community Features](#4-social--community-features)
5. [Engineering & Technical Architecture](#5-engineering--technical-architecture)
6. [Monetization & Growth Strategy](#6-monetization--growth-strategy)
7. [Implementation Roadmap](#7-implementation-roadmap)
8. [Immediate Action Items](#8-immediate-action-items)

---

## 1. Executive Summary & Architecture

Nexus transforms fleeting video/chat rooms into persistent, interactive spaces. Users can seamlessly transition between drawing on a shared canvas, playing mini-games, watching videos in sync, and chatting.

### Key Technical Pillars
* **State Synchronization:** Hybrid approach using CRDTs (Yjs) for high-frequency collaborative features (whiteboard, games) backed by Supabase Realtime & PostgreSQL for persistence.
* **Identity & Presence:** Supabase Auth integrated with low-latency presence channels for live cursor tracking and status updates.
* **Modular Room Engine:** Dynamic room loading based on room templates and persistent JSONB room payloads.

---

## 2. Core Platform Experience

| ID | Feature | Value Proposition | Technical Implementation |
|---|---|---|---|
| **1.1** | **Persistent Room State** | Rooms retain canvas strokes, game states, and video queues across sessions. | • Table: `room_states` (`id UUID PK`, `room_id UUID FK`, `payload JSONB`, `updated_at TIMESTAMPTZ`).<br>• Yjs CRDT synced via Supabase Realtime provider (`y-supabase`).<br>• Initial state hydrated from PostgreSQL on load; diffs broadcast over WebSocket. |
| **1.2** | **Room Templates** | One-click room creation with presets (*Blank Canvas*, *Game Night*, *Watch Party*, *Study Lounge*). | • Table: `room_templates` (`id`, `name`, `template_json`).<br>• Room creation copies template payload into new `room_states` record.<br>• Modal picker in UI. |
| **1.3** | **Profiles & Avatars** | Personalized identities across rooms. | • Table: `profiles` (`user_id UUID PK FK auth.users`, `avatar_url TEXT`, `display_name TEXT`, `bio TEXT`).<br>• Custom avatars stored in Supabase Storage (`avatars` bucket).<br>• Live display next to multiplayer cursors & chat bubbles. |
| **1.4** | **Enhanced Presence** | Real-time awareness of active user actions (`drawing`, `watching`, `typing`, `idle`). | • Presence payload: `{ user_id, x, y, status, active_tool }`.<br>• Status badges rendered on user cursor tags and participant list. |
| **1.5** | **Moderator Controls** | Host tools to maintain room decorum and manage session flow. | • Room state flags: `is_locked`, `muted_users: UUID[]`, `allow_drawing`.<br>• Realtime moderation commands validated via Supabase RLS / Edge Functions. |

---

## 3. Enriching Activities & Modules

### 🎨 Collaborative Whiteboard
* **Tools:** Freehand drawing, geometric shapes (rectangle, ellipse, arrow), text editing, sticky notes, and emoji stickers.
* **Engine:** Built with **Fabric.js** or **Excalidraw**, bound to a Yjs document (`ydoc.getMap('shapes')`).
* **Export:** One-click export to PNG, SVG, or JSON payload.

### 🎮 Multiplayer Games
* **Pictionary / Draw-&-Guess:** Built on top of the shared whiteboard with timed turns, word pickers, and automated score tracking.
* **Trivia & Quizzes:** Community or custom question packs (`quiz_questions` table) with real-time room leaderboards.
* **Collaborative Puzzles:** Jigsaw or grid-based games with piece coordinates tracked in CRDT state.

### 🍿 Watch Party
* **Synchronized Media:** Embedded players (YouTube, Vimeo, Twitch via IFrame API).
* **Sync Engine:** Host broadcasts timestamp (`player.getCurrentTime()`) and playback state (`playing`/`paused`). Peer clients auto-seek if drift exceeds threshold (>1.5s).
* **Playlist Queue:** Ordered video queue managed in `room_states` JSONB payload.

### 💬 Chat & Audio/Video
* **Text Chat:** Markdown support, custom emoji reactions, and threaded replies (`chat_messages` table with Realtime subscriptions).
* **P2P Voice/Video:** WebRTC signaling using Supabase Realtime channels. Screen share support and raise-hand queue.

---

## 4. Social & Community Features

| Feature | Description | Implementation Strategy |
|---|---|---|
| **Friends & Online Status** | See when friends are active or join public rooms. | Table `follows` (`follower_id`, `followed_id`). Broadcast online events to followers via presence channels. |
| **Instant Invites & QR Codes** | Low-friction room access via direct URL or mobile QR scanning. | Route `/room/:id`. Generate QR codes client-side using `qrcode.react`. |
| **Embeddable Rooms** | Embed interactive whiteboards or rooms on external websites. | Dedicated route `/embed/:roomId` with stripped shell UI and iframe sandbox security. |
| **Scheduled Events** | Plan recurring sessions (e.g., weekly sketch jams). | Table `scheduled_events`. Automated email/push notifications via Supabase Edge Functions. |
| **Badges & Achievements** | Gamify participant engagement ("First Creation", "Quiz Master"). | Tables `achievements` and `user_achievements`. Async processing triggered by activity milestones. |
| **Public Showcase** | Community gallery of saved whiteboards and high scores. | Table `gallery_items` with moderation approval queue exposed on `/gallery`. |

---

## 5. Engineering & Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Frontend                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ Fabric.js Canvas │  │ Media Sync Sync  │  │ Chat UI   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬─────┘  │
└───────────┼─────────────────────┼──────────────────┼────────┘
            │                     │                  │         
            ▼                     ▼                  ▼         
┌─────────────────────────────────────────────────────────────┐
│                     Client State & CRDT                     │
│                        Yjs Document                         │
└──────────────────────────────┬──────────────────────────────┘
                               │ WebSocket / Realtime          
                               ▼                               
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Platform                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │ Realtime Sync    │  │ Postgres DB      │  │ Auth &    │  │
│  │ & Presence       │  │ (JSONB + Rel)    │  │ Storage   │  │
│  └──────────────────┘  └──────────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technical Standards

| Domain | Best Practice | Purpose |
|---|---|---|
| **State Consistency** | Yjs + `y-supabase` provider | Guarantees eventual consistency across flaky network connections. |
| **Type Safety** | Automated Supabase TypeScript generation | Run `npx supabase gen types typescript --local > src/types/supabase.ts`. |
| **Performance** | Dynamic imports & idle callbacks | Code-split heavy libraries (Fabric.js, WebRTC scripts) and throttle cursor broadcasts. |
| **Quality Control** | Vitest (unit), Playwright (E2E) | Automated tests covering core user journey: Room Join → Draw → Sync → Leave. |
| **Accessibility** | ARIA live regions, contrast tokens | Full keyboard navigation and screen-reader announcements for chat/presence events. |
| **Observability** | Sentry error logging & analytics | Capture client-side crashes, sync latencies, and user engagement metrics. |

---

## 6. Monetization & Growth Strategy

1. **Freemium Identity:** Free basic avatars; premium animated avatars & sticker packs purchasable via Stripe.
2. **Room Upgrades:** Paid room boosts unlocking high-res canvas exports, unlimited video queue length, and custom room branding.
3. **Team & Community Workspaces:** Enterprise tier with SSO (SAML/OAuth), audit logs, and self-hosted Docker options.
4. **Organic SEO & Viral Loop:** Public `/gallery` indexing user-generated artwork to drive inbound traffic.

---

## 7. Implementation Roadmap

### Phase 1: Core Foundation & Persistence (Weeks 1–3)
- [x] Database schema: `room_states`, `profiles`, and `presences`.
- [x] Yjs CRDT binding over Supabase Realtime WebSocket provider.
- [x] Live cursor presence tracking with status indicators.
- [x] User authentication & avatar storage setup.

### Phase 2: Discovery & Room Templates (Weeks 4–6)
- [x] Public room lobby page (`/lobby`).
- [x] Room template engine (*Canvas*, *Watch Party*, *Game Night*).
- [x] Quick-share invite modal with client-side QR generation.

### Phase 3: Whiteboard & Activity Engine (Weeks 7–9)
- [x] Fabric.js canvas integration with Yjs shape map sync.
- [x] Canvas toolbar: shapes, text tools, color palette, undo/redo.
- [x] Export capabilities (PNG / SVG).

### Phase 4: Social Layer & Moderation (Weeks 10–12)
- [x] Friend list and online notification triggers.
- [x] Moderator toolkit (kick/mute users, lock room canvas).
- [x] Accessibility polish (keyboard navigation, ARIA live regions).
- [x] End-to-end integration test suite (Playwright).

---

## 8. Immediate Action Items

### 1. Database Migrations
Execute the initial schema setup in Supabase SQL Editor or local CLI:

```sql
-- Room states persistence table
CREATE TABLE IF NOT EXISTS public.room_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User profile table
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rooms overview view for lobby
CREATE OR REPLACE VIEW public.rooms_with_meta AS
SELECT 
    r.id, 
    r.name, 
    r.is_public,
    COUNT(DISTINCT p.user_id) AS participant_count,
    MAX(r.updated_at) AS last_activity
FROM public.rooms r
LEFT JOIN public.presences p ON p.room_id = r.id
GROUP BY r.id;
```

### 2. Client Yjs Setup
Initialize the document provider in `src/lib/sync.ts`:

```typescript
import * as Y from 'yjs';
import { SupabaseProvider } from 'y-supabase';
import { supabase } from '@/lib/supabaseClient';

export function initializeRoomSync(roomId: string) {
  const ydoc = new Y.Doc();
  const provider = new SupabaseProvider(
    supabase,
    'room_states',
    roomId,
    ydoc
  );

  const sharedShapes = ydoc.getMap('shapes');
  const sharedChat = ydoc.getArray('messages');

  return { ydoc, provider, sharedShapes, sharedChat };
}
```

### 3. Immediate Workflow
1. Verify Supabase Realtime replication is enabled for `room_states` table.
2. Run database migrations locally or via Supabase dashboard.
3. Test Yjs state sync using two browser windows connected to the same room.