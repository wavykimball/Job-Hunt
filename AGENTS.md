# AGENTS.md — Job Hunt MVP

## Mission

Build **Job Hunt**, a fully playable standalone browser game using React, TypeScript, Vite, Three.js, and Supabase. The game will later integrate with the start.ng platform, which is still being developed.

**The game must be playable, testable, and deployable before start.ng integration.** Do not make the app depend on start.ng endpoints, credentials, SDKs, or infrastructure that have not been provided and verified.

Read `PRD.md` before implementation. Treat it as the source of truth for MVP scope and acceptance criteria.

---

## 1. Required Stack

- React
- TypeScript
- Vite
- Three.js
- React Three Fiber only if it materially simplifies the implementation
- Supabase for persistent game data and trusted backend operations
- CSS with centralized design tokens

Use the simplest implementation that satisfies the PRD. Do not add unnecessary libraries, engines, services, or frameworks.

---

## 2. Non-Negotiable Product Rules

1. Build the game as a standalone web application first.
2. The core game must work without start.ng.
3. Use fictional companies and simulated application/hiring outcomes.
4. A successful CV shot submits an application; it does not automatically mean the player is hired.
5. Use the same aim-and-throw mechanic for CVs and work deliverables.
6. Allow only one active or paused job per player.
7. An employed player can apply for other jobs.
8. Players can accept/decline offers, pause/resume work, and quit after confirmation.
9. Work assignments award coins only after valid completion.
10. Coins are non-transferable game points with no monetary value.
11. Persist character, employment, assignment, and coin progress.
12. Keep the MVP focused. Do not add features outside the PRD without explicit approval.

---

## 3. Build Integration Interfaces, Not Hardcoded Dependencies

Create a clear integration boundary between game logic and platform services.

At minimum, define typed interfaces for:

- Authentication/current user
- Platform identity/profile
- Character appearance configuration
- Player/game data access

Place platform adapters in a dedicated directory, such as `src/integrations/startNg/`, or use a more accurate name if the architecture calls for it.

Recommended conceptual layout:

```text
src/
  app/
  components/
  game/
  features/
  services/
  integrations/
    auth/
      AuthAdapter.ts
      MockAuthAdapter.ts
      SupabaseAuthAdapter.ts
    startNg/
      StartNgContracts.ts
      StartNgAdapter.ts
      MockStartNgAdapter.ts
    character/
      CharacterAppearance.ts
      CharacterStyleAdapter.ts
      DefaultCharacterStyleAdapter.ts
  styles/
```

This is a guide, not a reason to create empty files or unnecessary abstraction. Every interface should have a clear purpose and a working implementation.

### Interface requirements

- UI components and game mechanics must not call hypothetical start.ng endpoints directly.
- Core game logic must not depend on a specific authentication provider.
- Use an internal Job Hunt player ID separate from any external platform user ID.
- Make external platform identity nullable until a verified integration exists.
- Keep external identity mapping in one place.
- Document the inputs, outputs, error states, and replacement procedure for each adapter.
- Do not couple the game database schema to an unconfirmed start.ng schema.

### Temporary implementations

Provide a working development implementation for authentication and character styling. It may use a development-only mock identity or a standalone Supabase Auth setup.

The chosen development path must be documented and runnable. Avoid implementing two overlapping authentication systems unless there is a clear use case.

Provide:
- A default character appearance configuration.
- Seeded fictional companies and assignments.
- A development-only sign-in flow or documented local test identity.
- An adapter configuration switch.
- Clear startup instructions.

Mock authentication must never silently be enabled in production. Fail fast with a clear configuration error if production authentication is missing.

---

## 4. Do Not Invent start.ng APIs

The start.ng platform is not yet complete. Never fabricate:
- API URLs or routes
- SDK imports or package names
- OAuth providers
- Token formats
- Session/cookie behavior
- User/profile schemas
- Character styling schemas
- Database tables
- Environment variable names purported to belong to start.ng

Use internal TypeScript contracts and temporary implementations until the real contract is supplied.

In `docs/INTEGRATION.md`, maintain:
- Confirmed integration facts
- Proposed interface contracts
- Unconfirmed assumptions
- Required information from the start.ng team
- Steps to replace the development adapters
- Integration test cases

Clearly label proposed examples as examples, not existing platform functionality.

---

## 5. Character Styling Requirements

Three.js character appearance is controlled through models, materials, textures, and supported model variants; ordinary CSS does not automatically change a 3D character.

- Define a platform-neutral `CharacterAppearance` type.
- Keep the renderer responsible for translating appearance data into 3D materials/model choices.
- Keep character setup UI separate from the rendering implementation.
- Persist the chosen appearance.
- Use safe defaults for missing or unsupported fields.
- Create an adapter that can later map the actual start.ng character/style contract to the internal type.
- Do not assume that start.ng has a central 3D model unless this is confirmed.
- Do not hardcode an unconfirmed start.ng color palette or token schema.

---

## 6. Game Architecture

Keep these concerns separate:

- React interface and navigation
- Three.js scene and rendering
- Aiming/throwing controls
- Shot evaluation
- Application and hiring rules
- Employment state transitions
- Assignment completion
- Coin rewards
- Persistence and leaderboard queries
- Authentication and platform integration

Do not put all game rules inside React components or Three.js animation callbacks.

Prefer small, typed functions for rules and state transitions so they can be tested without rendering the 3D scene.

### Throwing mechanic

Implement a simple, responsive aim-and-throw mechanic. A full basketball physics engine is not required.

- Desktop: pointer drag and release.
- Mobile: touch drag and release.
- Show shot feedback and remaining attempts.
- Use a deterministic and testable shot evaluation approach.
- Prevent client-only success state from directly awarding coins.
- Provide a safe way to exit/retry an attempt.

---

## 7. Data Integrity and Security

- Never trust the browser to set a player's coin balance.
- Use a Supabase Edge Function, database function, or equivalent trusted backend operation to validate assignment completion and award coins.
- Use idempotency keys or unique completion references so retries cannot award duplicate coins.
- Enforce at most one active/paused employment per player.
- Validate application, employment, assignment, and state transitions on the server.
- Enable and test Supabase Row Level Security for player-owned data.
- Public leaderboard results must not expose email addresses, auth IDs, or private profile fields.
- Never ship a Supabase service-role key or other secret to the browser.
- Keep actual CV uploads and sensitive recruitment data out of scope.
- Treat all browser inputs as untrusted.
- Do not mark a reward as confirmed until the backend responds successfully.

If backend reward validation is not yet available, use a clearly marked local prototype mode and do not present it as secure or production-ready. Finish the trusted implementation before claiming the MVP is complete.

---

## 8. Scope Control

Do not add the following unless the product owner explicitly approves them:
- Real employer accounts or real job listings
- Actual CV uploads or applications
- Real recruitment decisions
- Multiplayer or chat
- Multiple active jobs
- Payments, subscriptions, or purchases
- Transferable or cash-redeemable coins
- Shops, inventories, quests, achievements, or complex leveling
- Additional maps or open-world exploration
- AI recruitment
- Payroll or complex HR systems
- Unrequested admin dashboards
- Unrequested analytics integrations

Do not add decorative features that delay the core playable loop.

---

## 9. Implementation Order

Work in small, testable increments:

1. Inspect the repository and existing instructions before changing files.
2. Set up React, TypeScript, Vite, linting, and build scripts.
3. Create shared types and the app shell.
4. Build the single-court Three.js prototype with a character placeholder, hoops, and CV object.
5. Implement aiming, throwing, shot evaluation, and feedback.
6. Add fictional companies and application outcomes.
7. Add job offers and employment state transitions.
8. Add work assignments using the same throwing mechanic.
9. Add trusted coin rewards and duplicate-reward protection.
10. Add Supabase persistence and RLS policies.
11. Add leaderboard and profile persistence.
12. Add and document development authentication and character-style adapters.
13. Add tests for game rules, employment transitions, and reward idempotency.
14. Test the main flows at desktop and mobile viewport sizes.
15. Document setup, environment variables, migrations, seed data, deployment, and future start.ng integration.

Build and test a playable throwing prototype early. Do not spend the first phase building a large dashboard before the game mechanic works.

---

## 10. Required Documentation and Deliverables

Maintain:
- `PRD.md` — product requirements and acceptance criteria.
- `AGENTS.md` — these implementation rules.
- `docs/INTEGRATION.md` — adapter contracts and future start.ng integration plan.
- `README.md` — setup, scripts, environment variables, database setup, seed data, and deployment.
- Database migrations and seed scripts.
- Tests for core game rules and trusted reward operations.

Do not claim an integration is complete unless it has been tested against a real, confirmed start.ng contract.

---

## 11. Definition of Done

The MVP is not complete until:

- The app starts and builds using documented commands.
- It runs without any start.ng dependency.
- Development authentication works and is isolated from production.
- Character customization is saved and restored.
- The player can submit applications by throwing a CV.
- Application outcomes are simulated and distinct from shot success.
- The player can accept/decline offers and manage one job.
- The player can pause, resume, and quit employment.
- The player can complete work assignments using the same throwing mechanic.
- Coin rewards are validated by trusted backend logic and cannot be duplicated through retries.
- Progress persists after refresh/sign-in.
- The leaderboard displays saved data and does not expose private data.
- Desktop and mobile interaction paths are tested.
- Integration contracts and unknowns are documented.
- No fictional start.ng endpoint or schema is required to run the app.

When in doubt, choose the smallest implementation that satisfies the PRD and preserves a clean path to integration.
