/**
 * Normalized authentication contracts for Job Hunt
 */

export interface AuthUser {
  id: string; // auth provider subject id
  displayName: string;
  email?: string;
  isMock: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthChangeListener = (state: AuthState) => void;

export interface IAuthAdapter {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(displayName?: string, email?: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChange(listener: AuthChangeListener): () => void;
  isAvailable(): boolean;
}
