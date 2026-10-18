import { CharacterAppearance } from '@/types/game';

export const DEFAULT_CHARACTER_APPEARANCE: CharacterAppearance = {
  modelId: 'startng_human_v1',
  shirtColor: '#fd9644', // Orange (matching Raji)
  trouserColor: '#3d3d3d', // Charcoal (matching Raji)
  skinColor: '#c68642', // Warm tan (matching Raji)
  shoesColor: '#2a211b',
  accessoryId: null,
  body: 'male',
  hair: 'afro',
  hairColor: '#17120f',
  hat: 'none',
  accessory: 'none',
};

export const COLOR_OPTIONS = {
  shirt: [
    { label: 'Sun Orange', hex: '#fd9644' },
    { label: 'Coral Flame', hex: '#F23855' },
    { label: 'Cyan Pulse', hex: '#08BFE8' },
    { label: 'Golden Arc', hex: '#FFC629' },
    { label: 'Neon Green', hex: '#39CF61' },
    { label: 'Deep Teal', hex: '#174D5C' },
    { label: 'Crisp White', hex: '#FFFFFF' },
  ],
  trouser: [
    { label: 'Charcoal Dark', hex: '#3d3d3d' },
    { label: 'Midnight Navy', hex: '#193A46' },
    { label: 'Charcoal Ink', hex: '#102F3A' },
    { label: 'Classic Teal', hex: '#2E7185' },
    { label: 'Sun Orange', hex: '#FF9F0A' },
    { label: 'Chalk White', hex: '#F4F7F7' },
  ],
  skin: [
    { label: 'Warm Tan (Raji)', hex: '#c68642' },
    { label: 'Fair Peach', hex: '#F9D1B2' },
    { label: 'Warm Caramel', hex: '#D89A6B' },
    { label: 'Rich Chestnut', hex: '#8D5524' },
    { label: 'Deep Espresso', hex: '#52331E' },
  ],
  shoes: [
    { label: 'Dark Charcoal', hex: '#2a211b' },
    { label: 'Cyan Runner', hex: '#08BFE8' },
    { label: 'Coral Kicks', hex: '#F23855' },
    { label: 'Sun Gold', hex: '#FFC629' },
    { label: 'Pure White', hex: '#FFFFFF' },
    { label: 'Stealth Black', hex: '#102F3A' },
  ],
  accessories: [
    { id: null, label: 'None' },
    { id: 'headband', label: 'Pro Headband' },
    { id: 'cap', label: 'Arcade Cap' },
    { id: 'glasses', label: 'Career Specs' },
  ],
};

/**
 * Validates and ensures character appearance fields have safe defaults
 */
export function normalizeCharacterAppearance(raw?: Partial<CharacterAppearance> | null): CharacterAppearance {
  if (!raw) return { ...DEFAULT_CHARACTER_APPEARANCE };
  return {
    modelId: typeof raw.modelId === 'string' ? raw.modelId : DEFAULT_CHARACTER_APPEARANCE.modelId,
    shirtColor: typeof raw.shirtColor === 'string' ? raw.shirtColor : DEFAULT_CHARACTER_APPEARANCE.shirtColor,
    trouserColor: typeof raw.trouserColor === 'string' ? raw.trouserColor : DEFAULT_CHARACTER_APPEARANCE.trouserColor,
    skinColor: typeof raw.skinColor === 'string' ? raw.skinColor : DEFAULT_CHARACTER_APPEARANCE.skinColor,
    shoesColor: typeof raw.shoesColor === 'string' ? raw.shoesColor : DEFAULT_CHARACTER_APPEARANCE.shoesColor,
    accessoryId: raw.accessoryId !== undefined ? raw.accessoryId : DEFAULT_CHARACTER_APPEARANCE.accessoryId,
    body: (raw.body === 'female' || raw.body === 'male') ? raw.body : DEFAULT_CHARACTER_APPEARANCE.body,
    hair: typeof raw.hair === 'string' ? raw.hair : DEFAULT_CHARACTER_APPEARANCE.hair,
    hairColor: typeof raw.hairColor === 'string' ? raw.hairColor : DEFAULT_CHARACTER_APPEARANCE.hairColor,
    hat: typeof raw.hat === 'string' ? raw.hat : DEFAULT_CHARACTER_APPEARANCE.hat,
    accessory: typeof raw.accessory === 'string' ? raw.accessory : DEFAULT_CHARACTER_APPEARANCE.accessory,
  };
}
