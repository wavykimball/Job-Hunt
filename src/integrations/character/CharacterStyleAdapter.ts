import { CharacterAppearance } from '@/types/game';

export interface ICharacterStyleAdapter {
  getAppearance(playerId: string): Promise<CharacterAppearance>;
  saveAppearance(playerId: string, appearance: CharacterAppearance): Promise<void>;
  getDefaultAppearance(): CharacterAppearance;
}
