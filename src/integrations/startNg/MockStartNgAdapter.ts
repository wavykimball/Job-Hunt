import { CharacterAppearance } from '@/types/game';
import {
  IStartNgAdapter,
  StartNgGuest,
  StartNgLeaderboardEntry,
  StartNgScoreResult,
  StartNgStyle,
  StartNgUser,
} from './StartNgContracts';
import { DEFAULT_CHARACTER_APPEARANCE } from '../character/CharacterAppearance';

export class MockStartNgAdapter implements IStartNgAdapter {
  isPlatformConnected(): boolean {
    return false;
  }

  async getPlatformUser(): Promise<StartNgUser | StartNgGuest | null> {
    return null;
  }

  mapPlatformStyleToCharacter(style?: StartNgStyle | null): CharacterAppearance {
    if (!style) return { ...DEFAULT_CHARACTER_APPEARANCE };
    return {
      modelId: DEFAULT_CHARACTER_APPEARANCE.modelId,
      shirtColor: style.primaryColor || DEFAULT_CHARACTER_APPEARANCE.shirtColor,
      trouserColor: style.secondaryColor || DEFAULT_CHARACTER_APPEARANCE.trouserColor,
      skinColor: style.skinColor || DEFAULT_CHARACTER_APPEARANCE.skinColor,
      shoesColor: DEFAULT_CHARACTER_APPEARANCE.shoesColor,
      accessoryId: style.hat || style.accessory || null,
    };
  }

  async saveScore(_stats: { coins: number; deliverables: number; stars: number }): Promise<StartNgScoreResult | null> {
    return { ok: true };
  }

  async getLeaderboard(_limit?: number): Promise<StartNgLeaderboardEntry[]> {
    return [];
  }

  redirectToSignIn(): void {
    if (typeof window !== 'undefined') {
      const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
      window.location.href = `https://start.ng/?return_to=${returnTo}`;
    }
  }
}
