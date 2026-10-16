import { CharacterAppearance } from '@/types/game';

/**
 * Official start.ng platform integration contracts from https://start.ng/docs.md
 */

export interface StartNgStyle {
  body?: 'female' | 'male' | string;
  primaryColor?: string; // Top/shirt (#rrggbb)
  secondaryColor?: string; // Trousers/skirt (#rrggbb)
  skinColor?: string; // Skin color (#rrggbb)
  hairColor?: string; // Hair color (#rrggbb)
  hair?: 'short' | 'afro' | 'braids' | 'bun' | 'ponytail' | 'dreads' | 'bald' | string;
  hat?: 'none' | 'cap' | 'beanie' | 'tophat' | 'crown' | string;
  accessory?: 'none' | 'glasses' | 'earrings' | 'beard' | 'scarf' | 'backpack' | string;
}

export interface StartNgUser {
  id: number;
  name: string;
  account?: string;
  style?: StartNgStyle | null;
  face?: string;
}

export interface StartNgGuest {
  name: string;
  style?: StartNgStyle;
  face?: string;
}

export interface StartNgWhoAmIReply {
  type: 'startng:user';
  requestId?: string;
  user: StartNgUser | null;
  guest?: StartNgGuest;
}

export interface StartNgScoreResult {
  ok: boolean;
  result?: {
    best: number;
    improved: boolean;
    rank: number;
    stats: Record<string, number>;
  };
  error?: string;
}

export interface StartNgLeaderboardEntry {
  rank: number;
  player_id: number;
  name: string;
  color?: string;
  score?: number;
  stats?: Record<string, number>;
}

export interface IStartNgAdapter {
  isPlatformConnected(): boolean;
  getPlatformUser(): Promise<StartNgUser | StartNgGuest | null>;
  mapPlatformStyleToCharacter(style?: StartNgStyle | null): CharacterAppearance;
  saveScore(stats: { coins: number; deliverables: number; stars: number }): Promise<StartNgScoreResult | null>;
  getLeaderboard(limit?: number): Promise<StartNgLeaderboardEntry[]>;
  redirectToSignIn(): void;
}
