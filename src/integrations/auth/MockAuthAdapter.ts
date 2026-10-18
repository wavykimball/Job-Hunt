import { AuthChangeListener, AuthState, AuthUser, IAuthAdapter } from './AuthAdapter';

const DEV_AUTH_STORAGE_KEY = 'jobhunt_dev_auth_user';

export const DEV_PERSONAS: Array<{ id: string; name: string; rolePrompt: string }> = [
  { id: 'dev-raji-0', name: 'Raji', rolePrompt: 'Ready to ball on the court' },
  { id: 'dev-rookie-1', name: 'Rookie Devin', rolePrompt: 'Ready to apply everywhere' },
  { id: 'dev-pro-2', name: 'Jordan Hustle', rolePrompt: 'Eager to score coins' },
  { id: 'dev-mvp-3', name: 'Taylor Swift-Shot', rolePrompt: 'Hoops champion' },
];

export class MockAuthAdapter implements IAuthAdapter {
  private currentUser: AuthUser | null = null;
  private listeners: Set<AuthChangeListener> = new Set();

  constructor() {
    // Restore saved development user from localStorage or URL query param (?guest=1)
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const guestParam = params?.get('guest');
      if (guestParam) {
        const guestName = guestParam === '1' ? 'Raji' : guestParam;
        const stableId = `mock-user-${guestName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        this.currentUser = {
          id: stableId,
          displayName: guestName,
          email: `${guestName.toLowerCase().replace(/\s+/g, '.')}@example.test`,
          isMock: true,
        };
      } else {
        const stored = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
        if (stored) {
          this.currentUser = JSON.parse(stored);
        } else {
          // Default development persona is Raji
          this.currentUser = {
            id: 'mock-user-raji',
            displayName: 'Raji',
            email: 'raji@example.test',
            isMock: true,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  isAvailable(): boolean {
    return true;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async signIn(displayName?: string, email?: string): Promise<AuthUser> {
    const chosenName = (displayName || '').trim() || DEV_PERSONAS[0].name;
    const stableId = `mock-user-${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const user: AuthUser = {
      id: stableId,
      displayName: chosenName,
      email: email || `${chosenName.toLowerCase().replace(/\s+/g, '.')}@example.test`,
      isMock: true,
    };

    this.currentUser = user;
    try {
      localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }

    this.notify();
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    try {
      localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    this.notify();
  }

  onAuthStateChange(listener: AuthChangeListener): () => void {
    this.listeners.add(listener);
    listener({
      user: this.currentUser,
      isLoading: false,
      error: null,
    });

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state: AuthState = {
      user: this.currentUser,
      isLoading: false,
      error: null,
    };
    this.listeners.forEach((l) => l(state));
  }
}
