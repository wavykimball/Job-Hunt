# Job Hunt — 3D Basketball Career Arcade (MVP)

A fully playable, standalone 3D browser arcade game built with **React**, **TypeScript**, **Vite**, **Three.js**, and **Supabase**.

Apply for jobs by shooting your CV into company basketball hoops, accept job offers, complete work deliverables with the same aiming-and-throwing mechanic, earn coins, and climb the global leaderboard.

---

## 🎮 Core Game Mechanics & Features

1. **Aim-and-Throw 3D Gameplay:**
   - Touch drag on mobile or pointer drag on desktop pulls back to aim and calibrate throw trajectory.
   - Dotted trajectory guide visualizes flight path in real-time.
   - Dynamic 3D basketball court with warm sunset lighting, city skyline silhouettes, and branded company hoops.
   - Realistic net swish, rim bounce, and ground impact evaluation.
2. **Career & Employment Lifecycle:**
   - **Job Hunting Mode:** Aim and shoot your CV at 4 fictional companies (**CloudBounce**, **NeonGrid Labs**, **Apex Ventures**, **ByteHoops Inc**).
   - **Simulated Hiring Outcomes:** Successful shots submit applications resulting in *Job Offers*, *Under Review*, or *Application Closed*.
   - **Single Employment Invariant:** Enforces at most one active or paused job per player. An employed player can apply to other jobs freely.
   - **Take a Break & Resume:** Players can pause their employment without losing their role or coins.
   - **Quit Job:** Quitting preserves all earned coins, career statistics, and application history.
3. **Working Mode & Deliverables:**
   - Employed players switch from throwing CVs to throwing 3D **Deliverables** (e.g. *Docker Image Container*, *WebGL Frame Profiler*, *Smart Contract Suite*).
   - Completing deliverables awards coins.
4. **Trusted Server-Authoritative Rewards:**
   - Never trusts browser client state for coin balances.
   - Uses atomic idempotency keys (`assign_reward_{employmentId}_{assignmentId}`) so repeated requests or retries never duplicate rewards.
5. **Character Customization:**
   - Real-time 3D preview and customizer for Jersey colors, Pants, Skin tones, Sneakers, and Accessories (Headband, Cap, Glasses).
   - Persists appearance and restores on revisit.
6. **Arcade Audio Synthesizer:**
   - Web Audio API procedural synthesizer for net swishes, rim clanks, coin dings, and victory fanfares (zero external audio files or network latency).
7. **Global Leaderboard:**
   - Real persisted player rankings by total earned coins.
   - Strictly exposes public profile data (rank, name, avatar swatch, total coins); never exposes private auth identifiers or emails.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `v18+` or `v20+` or `v22+`
- npm `v9+` or `v10+`

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Run Automated Tests
```bash
npm test
```
Executes the Vitest test suite testing deterministic shot evaluation, employment state transitions, and reward idempotency.

### 4. Build for Production
```bash
npm run build
```
Runs strict TypeScript compilation (`tsc`) and Vite production bundle optimization.

---

## 🛠️ Environment Variables & Standalone Operation

Job Hunt operates in **Standalone Mode** by default, requiring **no start.ng dependencies or credentials**:

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_AUTH_ADAPTER` | `mock` | `mock` for standalone dev, or `supabase` |
| `VITE_SUPABASE_URL` | *optional* | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | *optional* | Supabase anonymous public key |
| `VITE_ALLOW_MOCK_AUTH` | `false` | Production safety gate: must be `true` if mock auth is permitted in a prod bundle |

### Development Personas (Mock Auth)
When running in standalone mode, you can select from pre-configured development personas or enter any custom player name:
- **Rookie Devin** (Ready to apply everywhere)
- **Jordan Hustle** (Eager to score coins)
- **Taylor Swift-Shot** (Hoops champion)

---

## 🗄️ Database Setup & Supabase Migrations

When connecting to Supabase:
1. Run the migration script located at `supabase/migrations/20261015000000_jobhunt_initial_schema.sql` in your Supabase SQL Editor.
2. The schema creates:
   - `players` (with JSONB `character_config`)
   - `companies` (seeded with 4 fictional companies)
   - `applications`
   - `employment` (with partial unique index enforcing at most 1 active/paused job)
   - `assignments`
   - `coin_transactions` (ledger with unique `idempotency_key`)
   - `public_leaderboard` (safe public view)
   - `claim_assignment_reward` (Postgres RPC transaction function with security definer)
   - Row Level Security (RLS) policies for authenticated players

---

## 🏗️ Architecture & Folder Structure

```text
src/
├── app/
│   └── App.tsx               # Main state router & 3D canvas stage coordinator
├── components/               # Tactile arcade UI components
│   ├── ArcadeButton.tsx      # 3D depth buttons (Primary, Secondary, Accent, Golden, Danger)
│   ├── ArcadeCard.tsx        # Rounded cards with borders & shadows
│   ├── HUD.tsx               # Top arcade bar (Coins, Status Pill, Nav Triggers)
│   └── Modal.tsx             # Accessible dialogs with blur backdrop
├── features/                 # Screen views & modal features
│   ├── auth/                 # WelcomeScreen with quick dev login
│   ├── character/            # CharacterSetupModal with real-time swatch picker
│   ├── dashboard/            # HomeDashboard (Unemployed / Employed / On a break)
│   ├── leaderboard/          # Global Leaderboard modal
│   ├── offers/               # JobOfferModal with acceptance and job switching rules
│   ├── play/                 # JobHuntingMode & WorkingMode with deliverable throwing
│   └── profile/              # Profile & settings modal
├── game/                     # Three.js 3D game engine
│   ├── components/           # GameCanvas with pointer & touch drag controls
│   ├── engine/               # Pure Three.js court scene, character mesh & physics
│   │   ├── CharacterMesh.ts  # Procedural 3D character with real-time appearance recoloring
│   │   ├── CourtScene.ts     # Basketball court, company hoops, lighting & projectiles
│   │   ├── ShotEvaluator.ts  # Deterministic collision, rim clank, and swish detection
│   │   └── TrajectoryCalculator.ts # Parabolic arc physics & aiming preview points
│   └── hooks/
│       └── useGameAudio.ts   # Web Audio synthesizer for arcade sound FX
├── integrations/             # Clean architectural boundaries
│   ├── auth/                 # IAuthAdapter, MockAuthAdapter, SupabaseAuthAdapter
│   ├── character/            # CharacterAppearance, ICharacterStyleAdapter
│   └── startNg/              # Proposed start.ng platform contracts & mock adapter
├── services/                 # Persistence & trusted domain logic
│   ├── gameStorage.ts        # Relational storage with localStorage fallback
│   ├── rewardService.ts      # Authoritative reward processing & idempotency checks
│   ├── seedData.ts           # Fictional companies & assignment templates
│   └── supabaseClient.ts     # Supabase client wrapper
└── styles/
    ├── tokens.css            # Centralized design tokens from STYLES.md
    └── arcade.css            # Component styles, typography, and responsive utilities
```

---

## 🔗 Future start.ng Platform Integration

Job Hunt is built with explicit integration boundaries so future start.ng platform integration can be implemented by adding adapters rather than modifying core gameplay:
- Review `docs/INTEGRATION.md` for interface contracts, unconfirmed assumptions, and step-by-step adapter replacement instructions.
