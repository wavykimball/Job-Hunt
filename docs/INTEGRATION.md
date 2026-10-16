# Job Hunt — start.ng Integration Architecture & Contracts

> **Document Status:** Integration Specification & Adapter Replacement Guide  
> **Target Platform:** start.ng (Currently in development)  
> **Notice:** All interfaces described herein are internal Job Hunt MVP contracts designed to establish clean platform boundaries. They do **not** assume, invent, or require undocumented start.ng server endpoints, token formats, or schemas.

---

## 1. Confirmed Integration Facts

1. **Standalone-First Principle:** The core game (aiming, shooting, employment lifecycle, assignments, coin rewards, character customization, and leaderboard) is fully playable and testable without any active connection to start.ng.
2. **Decoupled Identity:** Job Hunt maintains internal player IDs (`id: UUID`) separate from any external platform user ID (`platform_user_id: string | null`).
3. **No Fabricated Endpoints:** No hypothetical start.ng REST URLs, GraphQL schemas, OAuth callback endpoints, or private SDK packages are hardcoded into the application.
4. **Development Adapters Provided:** The game ships with working standalone adapters:
   - `MockAuthAdapter`: Development personas and guest identity.
   - `DefaultCharacterStyleAdapter`: Local/profile-backed character appearance persistence.
   - `MockStartNgAdapter`: Safe no-op adapter indicating platform is disconnected.
5. **Fail-Fast Safety:** Mock authentication cannot silently be enabled in production environments (`VITE_ALLOW_MOCK_AUTH !== 'true'`).

---

## 2. Integration Boundaries & Typed Contracts

The integration boundary is isolated in `src/integrations/`:

```text
src/integrations/
├── auth/
│   ├── AuthAdapter.ts              # Core IAuthAdapter interface & types
│   ├── MockAuthAdapter.ts          # Standalone dev personas & login
│   ├── SupabaseAuthAdapter.ts      # Supabase Auth implementation
│   └── index.ts                    # Adapter factory
├── character/
│   ├── CharacterAppearance.ts      # Normalized CharacterAppearance type & defaults
│   ├── CharacterStyleAdapter.ts    # ICharacterStyleAdapter interface
│   └── DefaultCharacterStyleAdapter.ts # Local persistent storage adapter
└── startNg/
    ├── StartNgContracts.ts         # Proposed start.ng platform contracts
    ├── MockStartNgAdapter.ts       # No-op mock adapter
    └── StartNgAdapter.ts           # Switcher & getter
```

### A. Authentication Adapter (`src/integrations/auth/AuthAdapter.ts`)

```typescript
export interface AuthUser {
  id: string; // Auth subject or external user id
  displayName: string;
  email?: string;
  isMock: boolean;
}

export interface IAuthAdapter {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(displayName?: string, email?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChange(listener: AuthChangeListener): () => void;
  isAvailable(): boolean;
}
```

### B. Platform Profile Adapter (`src/integrations/startNg/StartNgContracts.ts`)

```typescript
export interface StartNgUser {
  platformUserId: string;
  handle: string;
  avatarUrl?: string;
  email?: string;
}

export interface StartNgProfile {
  userId: string;
  displayName: string;
  bio?: string;
  joinedAt?: string;
}
```

### C. Character Appearance Adapter (`src/integrations/character/CharacterAppearance.ts`)

```typescript
export interface CharacterAppearance {
  modelId: string;
  shirtColor: string;
  trouserColor: string;
  skinColor: string;
  shoesColor: string;
  accessoryId: string | null;
}

export interface ICharacterStyleAdapter {
  getAppearance(playerId: string): Promise<CharacterAppearance>;
  saveAppearance(playerId: string, appearance: CharacterAppearance): Promise<void>;
  getDefaultAppearance(): CharacterAppearance;
}
```

### D. Proposed Platform Adapter (`src/integrations/startNg/StartNgContracts.ts`)

```typescript
export interface IStartNgAdapter {
  isPlatformConnected(): boolean;
  getPlatformUser(): Promise<StartNgUser | null>;
  getPlatformProfile(platformUserId: string): Promise<StartNgProfile | null>;
  mapPlatformStyleToCharacter(style: StartNgCharacterStyle): CharacterAppearance;
}
```

---

## 3. Unconfirmed Assumptions (Awaiting start.ng Team Confirmation)

Before connecting the real platform, the following questions remain intentionally open and must be confirmed with the start.ng engineering team:

| Question | Current Standalone Assumption | Confirmation Needed From start.ng |
|---|---|---|
| **Identity Provider** | UUID / string subject via `IAuthAdapter` | OAuth2, OIDC, Supabase Auth, or platform JWT session? |
| **Delivery Model** | Standalone responsive web app | Embedded iframe, subpath route, subdomain, or Web Component? |
| **User ID Exposure** | Passed to adapter via SDK or token | Header, query param, postMessage, or cookie? |
| **Character 3D Model** | Internal procedural Three.js character | Central 3D GLTF asset or 2D color tokens? |
| **Appearance Schema** | Hex colors (`shirtColor`, `trouserColor`, etc.) | Custom design tokens or avatar taxonomy? |
| **Storage Authority** | Postgres database / Supabase | Does start.ng store game data or only identity? |
| **Sign-out / Expiry** | Local token clearing | Platform single-sign-out webhook / event? |

---

## 4. How to Replace the Development Adapters

When start.ng is ready for integration:

### Step 1: Create `RealStartNgAuthAdapter.ts`
Implement `IAuthAdapter`:
```typescript
import { IAuthAdapter, AuthUser, AuthChangeListener } from '../auth/AuthAdapter';

export class RealStartNgAuthAdapter implements IAuthAdapter {
  isAvailable(): boolean {
    return true; // or check window.startNgSdk availability
  }
  async getCurrentUser(): Promise<AuthUser | null> {
    // Read platform session from start.ng SDK
  }
  async signIn(): Promise<AuthUser> {
    // Redirect to start.ng SSO login
  }
  async signOut(): Promise<void> {
    // Call start.ng logout
  }
  onAuthStateChange(listener: AuthChangeListener): () => void {
    // Subscribe to start.ng session events
  }
}
```

### Step 2: Register in Factory (`src/integrations/auth/index.ts`)
```typescript
if (import.meta.env.VITE_AUTH_ADAPTER === 'startng') {
  activeAuthAdapter = new RealStartNgAuthAdapter();
}
```

### Step 3: Implement `RealStartNgCharacterStyleAdapter.ts`
Map the confirmed start.ng styling payload into Job Hunt's `CharacterAppearance`:
```typescript
export class RealStartNgCharacterStyleAdapter implements ICharacterStyleAdapter {
  async getAppearance(playerId: string): Promise<CharacterAppearance> {
    const rawStyle = await startNgClient.getAvatarStyle(playerId);
    return normalizeCharacterAppearance({
      shirtColor: rawStyle.primaryColor,
      trouserColor: rawStyle.secondaryColor,
      accessoryId: rawStyle.headwearId,
    });
  }
}
```

---

## 5. Integration Test Cases

1. **Standalone Fallback Verification:**
   - App must boot smoothly when `VITE_AUTH_ADAPTER=mock` without network requests to external domains.
2. **Production Safety Check:**
   - When built with `NODE_ENV=production` and `VITE_ALLOW_MOCK_AUTH=false`, attempting to use `MockAuthAdapter` throws an explicit configuration error.
3. **External ID Linking Test:**
   - Verify that when a valid `platform_user_id` is supplied, `gameStorage.getOrCreatePlayer()` links the existing player profile without overwriting earned coins.
4. **Appearance Normalization Test:**
   - Passing unexpected or malformed appearance JSON from an external adapter gracefully falls back to default values without crashing Three.js materials.
