# Job Hunt — MVP Product Requirements Document

**Document status:** MVP specification  
**Product:** Job Hunt  
**Platform:** Responsive browser-based web game  
**Integration target:** start.ng (currently in development)  
**Primary objective:** Build a fully playable standalone game that can later connect to start.ng through documented integration interfaces without rebuilding the core game.

---

## 1. Product Overview

Job Hunt is a casual 3D browser game in which players apply for fictional jobs by throwing a CV into a basketball hoop representing a company. Once hired, players complete work assignments by throwing deliverables into a designated hoop. Completing assignments earns coins that contribute to a global leaderboard.

The game must run in a web browser without requiring an app download. It must be fully playable using temporary development authentication and local/development configuration before start.ng is available.

### Product promise

**Apply. Get hired. Do the work. Earn coins. Climb the leaderboard.**

### Target users

- People who enjoy casual, arcade-style browser games.
- start.ng users who want a playful career-themed experience.
- Players who want a simple game loop with persistent progress and rankings.

### MVP success criteria

A test player can:
1. Open the deployed or locally running game in a browser.
2. Sign in through the temporary development authentication flow.
3. choose and customize a character.
4. Apply to fictional companies by aiming and throwing a CV.
5. Receive a simulated application outcome and accept a job offer.
6. Complete work assignments using the same throwing mechanic.
7. Earn coins, see the balance persist, and appear on the leaderboard.
8. Pause/resume or quit a job, and apply for another job while employed.
9. Refresh or revisit the game without losing saved progress.

---

## 2. Technical Stack

Use the following stack unless a documented blocker requires a change:

- **React** — application interface and screen composition.
- **TypeScript** — application, game, and integration contracts.
- **Vite** — development server and production build.
- **Three.js** — 3D scene, basketball court, hoops, character, objects, and animations.
- **React Three Fiber** — optional; use if it simplifies Three.js scene composition within React. Do not add it merely for fashion.
- **Supabase** — PostgreSQL persistence and server-side functions for game data and trusted reward processing.
- **Supabase Auth or a development-only mock auth adapter** — temporary standalone identity. The authentication boundary must be replaceable with start.ng authentication.
- **CSS** — responsive interface styling and centralized UI tokens.

Do not add a physics engine, state-management library, UI framework, analytics vendor, or additional backend service unless it is justified by a concrete MVP requirement. Implement a simple, deterministic shot evaluation system before considering a full physics engine.

### Deployment

The app must be deployable as a standard web application. Users should be able to open a URL in a supported browser without downloading an application.

---

## 3. Product Principles

1. **Playable without start.ng:** No core gameplay may depend on start.ng being available.
2. **One simple game loop:** Job application and work submission use the same aim-and-throw interaction.
3. **Clear next action:** The player should always know whether to apply, continue working, resume, or accept an offer.
4. **Small MVP:** Use one court, one character base, a small set of fictional companies, and a small set of assignments.
5. **Integration by interfaces:** Platform-dependent behavior must be accessed through documented adapters, not scattered throughout the UI or game engine.
6. **Persistent progress:** Character settings, employment state, completed assignments, and coins must survive a reload.
7. **Server-authoritative rewards:** The browser must not be able to award arbitrary coins by directly editing client state.
8. **Responsive and accessible:** Support desktop and mobile browsers, clear instructions, keyboard/pointer/touch input where practical, and readable interface text.

---

## 4. MVP Scope

### In scope

- Standalone development sign-in / account identity.
- Character selection and a small set of appearance options supported by the chosen model.
- A single 3D basketball-court environment.
- Three to five fictional companies, each with a named role and hoop.
- Aim-and-throw CV interaction.
- Shot success/failure feedback and limited retries.
- Simulated application outcomes: under review, rejected, or job offer.
- Accept or decline an offer.
- One active job per player.
- Apply for other jobs while employed.
- Work assignments represented by in-game deliverable objects.
- Aim-and-throw deliverable interaction.
- Coin rewards for completed assignments.
- Employment actions: continue working, take a break, resume, and quit.
- Persistent player/game data.
- Global leaderboard ranked by total earned coins.
- Responsive screens and basic game settings.
- Explicit start.ng integration interfaces with temporary implementations.
- Setup instructions and environment variable documentation.

### Out of scope

Do not implement these unless separately approved:
- Real-world job listings or real employer/recruiter accounts.
- Uploading, parsing, or transmitting actual CV files.
- Real applications to companies.
- Real hiring decisions or employment guarantees.
- Multiplayer, live chat, friends, or social feeds.
- Multiple active jobs at once.
- Purchasable, transferable, or cash-redeemable coins.
- In-game store, inventory, quests, achievements, or battle passes.
- Multiple maps or elaborate open-world environments.
- AI recruitment or AI-generated work assignments.
- Timed leave approvals, payroll, salaries, or complex HR rules.
- Payments or subscriptions.
- Mobile native applications.

---

## 5. Information Architecture

```text
Job Hunt
├── Authentication
│   ├── Sign in
│   └── Development account / guest identity (development only)
├── Character Setup
│   ├── Select character
│   ├── Customize supported appearance options
│   └── Save and continue
├── Home Dashboard
│   ├── Character preview
│   ├── Employment status
│   ├── Coin balance
│   ├── Apply to Jobs
│   └── Continue Working / Resume Work (conditional)
├── Play
│   ├── Job Hunting
│   │   ├── Company hoops
│   │   ├── Aim and throw CV
│   │   └── Application result
│   └── Working
│       ├── Active job
│       ├── Current assignment
│       ├── Aim and throw deliverable
│       └── Completion result and reward
├── Job Offer
│   ├── Accept offer
│   └── Decline / keep looking
├── Leaderboard
│   └── Global ranking by total earned coins
├── Profile
│   ├── Display name
│   ├── Character customization
│   ├── Current employment and history
│   └── Game statistics
└── Employment Actions
    ├── Take a break
    ├── Resume work
    └── Quit job
```

### Primary navigation

- Home
- Play
- Leaderboard
- Profile

On mobile, use compact bottom navigation. During a game session, keep the 3D game area prominent and avoid persistent navigation elements that obstruct controls.

---

## 6. User States and Dashboard Behavior

### New player / no active job

Display:
- Employment status: **Unemployed**
- Primary CTA: **Apply to Jobs**
- Coin balance
- Character preview

### Player with an active job

Display:
- Employment status: **Employed**
- Active company and role
- Primary CTA: **Continue Working**
- Secondary CTA: **Apply to Jobs**
- Coin balance

### Player on a break

Display:
- Employment status: **On a break**
- Active company and role
- Primary CTA: **Resume Work**
- Secondary CTA: **Apply to Jobs**
- Coin balance

A player on a break cannot earn coins from that paused job until work resumes.

---

## 7. Core User Flows

### Flow A — First-time player

1. Open Job Hunt.
2. Sign in using the development authentication implementation.
3. Select a character and customize supported appearance options.
4. Save the character configuration.
5. Arrive at the dashboard with **Unemployed** status.
6. Select **Apply to Jobs**.
7. Enter the basketball court and see company hoops.
8. Select a company/role, aim, and throw the CV.
9. Receive clear shot feedback.
10. On a successful shot, record an application submission.
11. Receive a simulated outcome.
12. If offered a job, accept or decline.
13. If accepted, return to the dashboard with the active job visible.

### Flow B — Job application

1. Enter Job Hunting.
2. Choose an available fictional company hoop.
3. See the company name, role, and concise instructions.
4. Aim by pointer/touch drag and release to throw.
5. The game evaluates the shot using a deterministic, server-validated or server-verifiable result.
6. A successful shot submits the application.
7. A missed shot allows another attempt, up to the configured attempt limit.
8. After the attempt limit, allow the player to move to another company.
9. Only successful shots submit applications; a shot does not itself guarantee employment.

### Flow C — Job offer

1. A submitted application may result in **Under review**, **Rejected**, or **Offer received**.
2. A job offer shows the company and role.
3. The player chooses **Accept Job** or **Decline / Keep Looking**.
4. Accepting creates an active employment record, provided the player does not already have another active job.
5. If switching jobs, the player must explicitly end the current job before accepting a new active job.
6. Declining an offer does not change current employment.

### Flow D — Work assignment

1. Select **Continue Working**.
2. See the active company, role, and current assignment.
3. Aim and throw the deliverable object into the designated company hoop.
4. A miss allows another attempt within the configured limit.
5. A successful shot completes the assignment.
6. Award coins once, using trusted backend logic.
7. Show the reward and updated balance.
8. Load the next assignment or return to the active-job screen.

### Flow E — Pause and resume

1. From the active-job screen, select **Take a Break**.
2. Confirm the action.
3. Set employment status to `paused`.
4. Disable assignment completion/rewards for that employment while paused.
5. The player can still apply to other jobs.
6. Select **Resume Work** to return the employment to `active`.

### Flow F — Quit and switch jobs

1. Select **Quit Job** from the active-job screen.
2. Show a confirmation explaining that the player will no longer be able to complete assignments for that job.
3. On confirmation, set the employment record to `ended` and record an end timestamp.
4. Preserve the player's coins, profile, and employment history.
5. The dashboard shows **Unemployed** unless another valid active job exists.
6. The player can continue applying for jobs.

### Flow G — Returning player

1. Sign in with the same identity.
2. Load the existing player profile and saved progress.
3. If unemployed, show **Apply to Jobs**.
4. If employed, show **Continue Working** and **Apply to Jobs**.
5. If paused, show **Resume Work** and **Apply to Jobs**.
6. Show the current coin balance and leaderboard position where available.

---

## 8. Game Mechanics and Rules

### Court and companies

- Start with one compact court scene.
- Show three to five fictional companies.
- Each company has a name, role, hoop, and configurable difficulty/hiring rules.
- Keep labels legible and ensure hoops are visually distinguishable.
- Reuse the same hoop component for application and work modes.

### Throwing mechanic

- Desktop: pointer drag to aim, release to throw.
- Mobile: touch drag to aim, release to throw.
- Provide a visible trajectory or aiming guide where practical.
- Use a simple deterministic trajectory/target evaluation for the MVP; realistic basketball physics are not required.
- Provide clear success, miss, retry, and exit feedback.
- Respect the configured attempt limit.
- Prevent a client from repeatedly submitting the same shot result to earn rewards.

### Applications

- Successful CV shot = application submitted, not automatic employment.
- Simulate outcomes through configurable game rules.
- Keep hiring probabilities and outcome logic in configuration or server-side logic, not hardcoded in presentation components.
- The game must make clear that companies and hiring outcomes are fictional in the MVP.

### Employment

- Maximum of one active job per player.
- A player may apply for other jobs while employed or paused.
- A player must end an existing active job before accepting another job as active.
- Quitting preserves earned coins and employment history.
- Pausing preserves employment but disables work rewards while paused.
- Do not implement real-time deadlines, penalties, or leave approvals.

### Work assignments

- Use a small configured set of fictional assignments.
- A completed assignment cannot be completed again for another reward.
- Rewards must be calculated and recorded by trusted backend logic.
- If a request is retried due to network failure, the reward operation must be idempotent.

### Coins and leaderboard

Suggested starting configuration:
- Standard assignment: 10 coins.
- Bonus assignment: 20 coins.

These are tunable defaults, not immutable rules.

- No coins for merely accepting a job.
- No coins for a missed shot.
- No coins for an application in the initial MVP.
- Coins are non-transferable, non-purchasable, and have no monetary value.
- The leaderboard ranks players by total earned coins.
- Use a stable tie-breaker, such as earliest timestamp at which the current total was reached or a consistent secondary sort key.
- The server is authoritative for balance and leaderboard values.

---

## 9. Screens and UI Requirements

### Welcome / Sign in
- Explain the game in one short sentence.
- Provide the development sign-in option.
- Do not imply start.ng authentication is connected until it actually is.

### Character Setup
- Show a character preview.
- Offer only appearance options supported by the selected model.
- Save appearance configuration to the player profile.
- Include a clear continue action.

### Home Dashboard
- Show character, employment state, coin balance, and next action.
- Unemployed: **Apply to Jobs**.
- Employed: **Continue Working** and **Apply to Jobs**.
- Paused: **Resume Work** and **Apply to Jobs**.

### Job Hunting Scene
- Display company names and roles near hoops.
- Show concise aim-and-throw instructions.
- Show remaining attempts for the selected company.
- Provide readable success/miss feedback and a clear way to continue.

### Application Result
- Distinguish shot success from application outcome.
- Present a job offer only when the simulated application result is an offer.
- Allow the player to continue applying if there is no offer.

### Job Offer
- Show company and role.
- Provide **Accept Job** and **Decline / Keep Looking**.
- Explain if the player must end a current job before accepting.

### Active Job / Work Assignment
- Show employer, role, employment status, and current assignment.
- Provide **Continue Working**, **Take a Break**, and **Quit Job** where appropriate.
- Ask for confirmation before quitting.
- Do not display work-reward actions when employment is paused.

### Work Result
- Show assignment completion and coins earned.
- Show updated coin balance only after the backend confirms the reward.
- Prevent duplicate reward claims.

### Leaderboard
- Show rank, display name, avatar/character thumbnail, and total coins.
- Use real saved player data, not hardcoded dummy rankings in production.
- Clearly label any development seed data.

### Profile and Settings
- Allow editing display name and supported character appearance.
- Show current employment and simple game statistics.
- Include sign-out through the active authentication adapter.

---

## 10. Character and Centralized Styling Architecture

A Three.js character uses 3D models, materials, textures, and possibly rigged meshes. Ordinary CSS does not directly change the character's 3D materials.

Define a typed, platform-neutral `CharacterAppearance` configuration. For example:

```ts
export type CharacterAppearance = {
  modelId: string;
  shirtColor: string;
  trouserColor: string;
  accessoryId: string | null;
};
```

The final fields must match the options the actual character model supports. This is a proposed internal contract, not an existing start.ng schema.

Requirements:
- The character renderer consumes `CharacterAppearance`.
- The character setup screen edits this configuration.
- The development implementation supplies a default appearance configuration.
- The configuration is saved with the player profile.
- When start.ng exposes a central styling/character contract, implement an adapter that maps it into the internal `CharacterAppearance` type.
- Do not hardcode start.ng colors or fields as if they were confirmed.
- Unsupported values must fall back to safe defaults.
- Keep character model, appearance mapping, and game UI styling separate.

---

## 11. Integration Architecture for start.ng

start.ng is still being built. Do not invent its API routes, auth provider, database schema, SDK, token format, or design-system contract.

### Required integration boundaries

Define documented TypeScript interfaces for at least:

1. **Authentication adapter**
   - Get the current user/session.
   - Subscribe to authentication changes if supported.
   - Sign in/out through the selected implementation.
   - Return a stable external user ID and basic profile fields.

2. **Platform profile adapter**
   - Read the signed-in platform identity.
   - Read supported profile fields.
   - Map platform identity to the internal Job Hunt player profile.

3. **Character appearance adapter**
   - Read central character/style configuration when available.
   - Map it to Job Hunt's internal appearance type.
   - Fall back to local defaults when unavailable.

4. **Game data services**
   - Read/write player-specific game data.
   - Manage applications, employment, assignments, coin transactions, and leaderboard queries.
   - Keep these services independent from the identity provider.

### Temporary development implementations

- Provide a development-only mock authentication adapter or a standalone Supabase Auth implementation.
- Provide a development character-style configuration.
- Provide seeded fictional companies and assignments.
- Make it possible to run the game without start.ng credentials or endpoints.
- Clearly mark development-only code and sample data.
- Ensure mock authentication cannot accidentally be enabled in production builds.

### Identity mapping

- Use an internal Job Hunt player ID.
- Store a separate external platform user ID when available.
- Do not use email address alone as an automatic account-linking mechanism.
- Link an existing game profile to a start.ng account only through a secure, explicit or platform-authorized mapping process.
- Never expose service-role credentials or trusted backend secrets in the browser.

### Integration documentation

Document:
- Each interface and its purpose.
- Which implementation is used in standalone development.
- What information start.ng must eventually provide.
- Which assumptions remain unconfirmed.
- How to replace the development adapter.
- How to test integration without altering core gameplay.

---

## 12. Data Model

Use a normalized relational model in Supabase. Exact schema and constraints should be documented in migrations.

### `players`
- `id` — internal UUID primary key.
- `platform_user_id` — nullable external start.ng user ID; unique when present.
- `auth_subject` — nullable subject from standalone auth provider, if used.
- `display_name`.
- `character_config` — JSONB with validated appearance fields.
- `created_at`, `updated_at`.

### `companies`
- `id`.
- `name`.
- `role_title`.
- `difficulty`.
- `is_active`.
- `game_config` — controlled configuration for fictional outcomes.

### `applications`
- `id`.
- `player_id`.
- `company_id`.
- `status` — submitted, under_review, offered, rejected, accepted, declined.
- `created_at`, `updated_at`.
- Store shot/submission identifiers needed to prevent duplicate submissions.

### `employment`
- `id`.
- `player_id`.
- `company_id`.
- `role_title`.
- `status` — active, paused, ended.
- `started_at`, `ended_at`, `updated_at`.
- Enforce at most one active or paused employment per player according to the agreed state rules. Paused employment still counts as the player's current employment.

### `assignments`
- `id`.
- `employment_id`.
- `assignment_template_id` or equivalent configured assignment reference.
- `title`.
- `difficulty`.
- `reward_coins`.
- `status` — available or completed.
- `completed_at`.
- Store a unique completion/reward reference to prevent duplicate claims.

### `coin_transactions`
- `id`.
- `player_id`.
- `amount`.
- `reason`.
- `reference_id`.
- `idempotency_key` (unique).
- `created_at`.

The current coin balance should be derived from or reconciled with trusted coin transactions. Do not let clients directly update balances.

### Leaderboard

Use a secure query, view, or server function that returns only public leaderboard fields:
- rank,
- display name,
- approved avatar/character thumbnail data,
- total earned coins.

Do not expose emails, auth identifiers, or private profile data through leaderboard queries.

---

## 13. Security and Data Integrity

- Apply Supabase Row Level Security to player-owned records.
- A player may read or update only permitted fields on their own profile.
- Validate all important state transitions on the server.
- Never trust a client-provided coin amount or final balance.
- Award coins through a server-side function or trusted backend operation.
- Make assignment completion/reward claims idempotent.
- Prevent duplicate application submissions from repeated requests.
- Validate company, employment, assignment, and status IDs on the server.
- Ensure only one active/paused employment is allowed per player.
- Keep service-role keys and other secrets out of client code and public environment variables.
- Do not store actual CV documents or sensitive recruitment information in the MVP.
- Expose only public fields in leaderboard queries.
- Disable development mock authentication in production.

---

## 14. Non-Functional Requirements

### Performance
- Load a simple playable scene without unnecessarily large assets.
- Optimize 3D models and textures for browser delivery.
- Limit expensive real-time lighting and post-processing.
- Reuse scene objects where practical.
- Display a loading state while assets load.
- Handle WebGL or asset-loading failures with a helpful message.

### Responsiveness
- Support desktop and mobile browser layouts.
- Provide pointer and touch controls.
- Keep company labels, status, instructions, and feedback legible on small screens.
- Avoid controls hidden behind browser safe areas or overlays.

### Accessibility and usability
- Use readable contrast and clear button labels.
- Do not rely on color alone to communicate success or failure.
- Provide concise onboarding instructions.
- Support keyboard navigation for non-game UI.
- Provide a way to leave or restart a game attempt without reloading the entire app.

### Reliability
- Persist progress after confirmed server operations.
- Handle network failures and show retry feedback.
- Prevent duplicate rewards on retries.
- Do not show a reward as final until the server confirms it.

---

## 15. Acceptance Criteria

The MVP is accepted when all the following are true:

### Standalone operation
- [ ] The app installs and runs using documented commands.
- [ ] It can be built and tested without any start.ng service, credentials, or endpoint.
- [ ] Mock/development authentication works in development.
- [ ] Production configuration cannot silently fall back to mock authentication.

### Character
- [ ] A player can select and customize supported appearance options.
- [ ] The character renderer applies the saved configuration.
- [ ] Appearance persists after reload.
- [ ] Character styling is accessed through an adapter/interface.

### Job hunting
- [ ] The scene displays fictional companies and their hoops.
- [ ] Pointer and touch aim-and-throw controls work on supported devices.
- [ ] Missed shots provide feedback and respect the attempt limit.
- [ ] A successful shot submits an application exactly once.
- [ ] A successful shot does not automatically guarantee a job offer.
- [ ] Simulated application outcomes are visible and understandable.

### Employment
- [ ] An offered job can be accepted or declined.
- [ ] Only one active/paused job exists per player.
- [ ] An employed player can apply to other jobs.
- [ ] A player can pause and resume a job.
- [ ] A player can quit after confirmation.
- [ ] Quitting preserves coins and employment history.
- [ ] Dashboard CTAs match unemployed, employed, and paused states.

### Work and coins
- [ ] A player can view and complete a work assignment using the throwing mechanic.
- [ ] Successful completion awards the configured number of coins.
- [ ] Misses and retries do not award coins.
- [ ] A completed assignment cannot pay out more than once.
- [ ] The reward is confirmed by trusted backend logic.
- [ ] Coin balance persists after reload.

### Leaderboard
- [ ] The leaderboard uses saved player data.
- [ ] It ranks players by total earned coins.
- [ ] It does not expose private identifiers or emails.
- [ ] Development seed data is clearly marked.

### Integration readiness
- [ ] Authentication and character styling contracts are documented.
- [ ] No invented start.ng API is required for standalone operation.
- [ ] The start.ng integration can be implemented by adding/replacing adapters.
- [ ] The integration documentation lists unconfirmed platform requirements.

---

## 16. Suggested Implementation Order

1. Initialize React, TypeScript, and Vite; add linting and build scripts.
2. Establish project structure, shared types, and CSS design tokens.
3. Create the app shell, routes, and responsive dashboard.
4. Build a single Three.js court, character placeholder, hoops, and CV object.
5. Implement aiming, throwing, deterministic shot evaluation, and feedback.
6. Add company selection and simulated application outcomes.
7. Add job offers and employment state transitions.
8. Add assignments and reuse the throwing mechanic.
9. Implement trusted coin rewards and idempotency.
10. Add Supabase schema, policies, and persistence.
11. Add leaderboard queries and profile persistence.
12. Implement the development auth and character-style adapters.
13. Add tests for game rules, employment transitions, and reward idempotency.
14. Test desktop and mobile flows.
15. Document setup, environment variables, deployment, and future start.ng integration.

The implementation order may be adjusted to reduce risk, but do not postpone the playable throwing prototype until the end.

---

## 17. Open Integration Questions

These are intentionally unresolved until start.ng's implementation is known:

- Which identity provider and session model will start.ng use?
- How will a signed-in user ID be exposed to integrated applications?
- Will Job Hunt be embedded, opened as a separate route/subdomain, or use another integration pattern?
- Does start.ng provide a central character model or only appearance/style tokens?
- Which character appearance fields are supported centrally?
- Will start.ng require game data to be stored in its own backend?
- What profile fields can Job Hunt read?
- What logout/session-expiry behavior is required?

Do not guess the answers. Keep the standalone game functional and record confirmed answers in the integration documentation when they become available.
