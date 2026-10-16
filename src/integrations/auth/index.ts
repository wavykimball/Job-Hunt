import { IAuthAdapter } from './AuthAdapter';
import { MockAuthAdapter } from './MockAuthAdapter';
import { SupabaseAuthAdapter } from './SupabaseAuthAdapter';
import { isSupabaseConfigured } from '@/services/supabaseClient';

export * from './AuthAdapter';
export * from './MockAuthAdapter';
export * from './SupabaseAuthAdapter';

let activeAuthAdapter: IAuthAdapter | null = null;

export function getAuthAdapter(): IAuthAdapter {
  if (activeAuthAdapter) {
    return activeAuthAdapter;
  }

  const preferredAdapter = import.meta.env.VITE_AUTH_ADAPTER;

  if (preferredAdapter === 'supabase' || (isSupabaseConfigured && preferredAdapter !== 'mock')) {
    activeAuthAdapter = new SupabaseAuthAdapter();
  } else {
    activeAuthAdapter = new MockAuthAdapter();
  }

  return activeAuthAdapter;
}
