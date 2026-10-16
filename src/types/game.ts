/**
 * Core domain types for Job Hunt MVP
 */

export interface CharacterAppearance {
  modelId: string;
  shirtColor: string;
  trouserColor: string;
  skinColor: string;
  shoesColor: string;
  accessoryId: string | null;
}

export type EmploymentStatus = 'unemployed' | 'active' | 'paused' | 'ended';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'offered'
  | 'rejected'
  | 'accepted'
  | 'declined';

export interface Player {
  id: string;
  platform_user_id: string | null;
  auth_subject: string | null;
  display_name: string;
  character_config: CharacterAppearance;
  created_at: string;
  updated_at: string;
  total_coins: number;
  stars_count?: number;
}

export interface Company {
  id: string;
  name: string;
  tagline: string;
  role_title: string;
  difficulty: 'Junior' | 'Mid' | 'Senior' | 'Lead';
  accent_color: string;
  is_active: boolean;
  hiring_chance: number; // probability of offer upon submission (e.g. 0.7)
  hoop_position: [number, number, number]; // 3D coordinates on court
  game_config?: {
    rim_radius?: number;
    wind?: number;
  };
}

export interface Application {
  id: string;
  player_id: string;
  company_id: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  shot_id?: string;
}

export interface Employment {
  id: string;
  player_id: string;
  company_id: string;
  role_title: string;
  status: 'active' | 'paused' | 'ended';
  started_at: string;
  ended_at: string | null;
  updated_at: string;
}

export interface Assignment {
  id: string;
  employment_id: string;
  template_id: string;
  title: string;
  description: string;
  deliverable_name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  reward_coins: number;
  status: 'available' | 'completed';
  completed_at: string | null;
  idempotency_key?: string;
}

export interface CoinTransaction {
  id: string;
  player_id: string;
  amount: number;
  reason: string;
  reference_id: string;
  idempotency_key: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  player_id: string;
  display_name: string;
  character_config: CharacterAppearance;
  total_coins: number;
  updated_at: string;
}

export interface ShotAttempt {
  shotId: string;
  playerId: string;
  targetCompanyId: string;
  type: 'CV' | 'DELIVERABLE';
  power: number;
  angleHorizontal: number;
  angleVertical: number;
  success: boolean;
  isSwish: boolean;
  distance: number;
  timestamp: number;
}

export type ActiveGameView = 'DASHBOARD' | 'JOB_HUNT' | 'WORKING';
