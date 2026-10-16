import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { AuthChangeListener, AuthState, AuthUser, IAuthAdapter } from './AuthAdapter';

export class SupabaseAuthAdapter implements IAuthAdapter {
  private listeners: Set<AuthChangeListener> = new Set();
  private currentUser: AuthUser | null = null;

  constructor() {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.currentUser = {
            id: session.user.id,
            displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Player',
            email: session.user.email,
            isMock: false,
          };
        } else {
          this.currentUser = null;
        }
        this.notify();
      });
    }
  }

  isAvailable(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.isAvailable()) return null;
    const { data } = await supabase!.auth.getUser();
    if (data.user) {
      this.currentUser = {
        id: data.user.id,
        displayName: data.user.user_metadata?.display_name || data.user.email?.split('@')[0] || 'Player',
        email: data.user.email,
        isMock: false,
      };
      return this.currentUser;
    }
    return null;
  }

  async signIn(displayName?: string, email?: string): Promise<AuthUser> {
    if (!this.isAvailable()) {
      throw new Error('Supabase Auth is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    // In a full Supabase environment, signInWithOtp or anonymous/password can be used.
    // For standalone MVP demo with Supabase, signInAnonymously or signInWithOtp is supported.
    const userEmail = email || `player_${Date.now()}@jobhunt.dev`;
    const { data, error } = await supabase!.auth.signInAnonymously({
      options: {
        data: {
          display_name: displayName || 'Hoops Pro',
        },
      },
    });

    if (error) {
      throw new Error(`Supabase sign in failed: ${error.message}`);
    }

    const authUser: AuthUser = {
      id: data.user!.id,
      displayName: displayName || 'Hoops Pro',
      email: data.user?.email || userEmail,
      isMock: false,
    };
    this.currentUser = authUser;
    this.notify();
    return authUser;
  }

  async signOut(): Promise<void> {
    if (this.isAvailable()) {
      await supabase!.auth.signOut();
    }
    this.currentUser = null;
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
