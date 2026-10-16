import { CharacterAppearance } from '@/types/game';
import { ICharacterStyleAdapter } from './CharacterStyleAdapter';
import { DEFAULT_CHARACTER_APPEARANCE, normalizeCharacterAppearance } from './CharacterAppearance';

const STORAGE_KEY_PREFIX = 'jobhunt_character_';

export class DefaultCharacterStyleAdapter implements ICharacterStyleAdapter {
  private fallbackMemoryMap = new Map<string, CharacterAppearance>();

  getDefaultAppearance(): CharacterAppearance {
    return { ...DEFAULT_CHARACTER_APPEARANCE };
  }

  async getAppearance(playerId: string): Promise<CharacterAppearance> {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${playerId}`);
      if (stored) {
        return normalizeCharacterAppearance(JSON.parse(stored));
      }
    } catch {
      // In SSR or restricted storage environments
    }

    if (this.fallbackMemoryMap.has(playerId)) {
      return this.fallbackMemoryMap.get(playerId)!;
    }

    return this.getDefaultAppearance();
  }

  async saveAppearance(playerId: string, appearance: CharacterAppearance): Promise<void> {
    const normalized = normalizeCharacterAppearance(appearance);
    this.fallbackMemoryMap.set(playerId, normalized);
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${playerId}`, JSON.stringify(normalized));
    } catch {
      // ignore storage quota / restricted error
    }
  }
}
