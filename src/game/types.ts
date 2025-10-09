// Game constants and types
export const DISEASE_COUNT = 5;
export const LOSING_LEVEL = 6;
export const MAX_INFECTION_RATE = 7;
export const INITIAL_INFECTION_RATE = 3;
export const REROLLS_ALLOWED = 2;
export const DICE_TO_INCREASE_PANIC = 2;
export const NORMAL_DICE_TO_REDUCE_PANIC = 4;
export const PR_DICE_TO_REDUCE_PANIC = 3;

// Disease types
export enum Disease {
  AVIAN = 0,
  SWINE = 1,
  SARS = 2,
  SMALLPOX = 3,
  EBOLA = 4,
  PANIC = 5
}

// Role types
export enum Role {
  MEDIC = 0,
  RESEARCHER = 1,
  PREXPERT = 2,
  SCIENTIST = 3,
  EPIDEMIOLOGIST = 4,
  BIOTERRORIST = 5
}

// Game state
export interface GameState {
  diseases: (number | null)[]; // null means cured
  panicLevel: number;
  currentRole: Role;
  infectionRate: number;
  rerollsRemaining: number;
  gamePhase: 'infection' | 'treatment';
  infectionDice: Disease[];
  treatmentDice: Disease[];
  savedTreatmentDice: boolean[];
  lockedTreatmentDice: boolean[]; // dice that cannot be unsaved (e.g., panic dice with penalty)
  hasWon: boolean;
  hasLost: boolean;
  message: string;
}

// Dice counts by disease
export type DiseaseCounts = Record<Disease, number>;