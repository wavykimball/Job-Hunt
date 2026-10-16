import {
  Application,
  Assignment,
  CharacterAppearance,
  CoinTransaction,
  Employment,
  LeaderboardEntry,
  Player,
} from '@/types/game';
import { DEFAULT_CHARACTER_APPEARANCE } from '@/integrations/character/CharacterAppearance';
import { INITIAL_ASSIGNMENT_TEMPLATES } from './seedData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEYS = {
  PLAYERS: 'jobhunt_players_v1',
  APPLICATIONS: 'jobhunt_applications_v1',
  EMPLOYMENTS: 'jobhunt_employments_v1',
  ASSIGNMENTS: 'jobhunt_assignments_v1',
  TRANSACTIONS: 'jobhunt_transactions_v1',
};

// Seeded community players for global leaderboard
const SEEDED_LEADERBOARD_PLAYERS: Array<{ name: string; coins: number; appearance: Partial<CharacterAppearance> }> = [
  { name: 'Kobe Coder', coins: 180, appearance: { shirtColor: '#FFC629', trouserColor: '#193A46' } },
  { name: 'LeBron JS', coins: 145, appearance: { shirtColor: '#F23855', trouserColor: '#102F3A' } },
  { name: 'Curry 3Pointer', coins: 120, appearance: { shirtColor: '#08BFE8', trouserColor: '#2E7185' } },
  { name: 'Shaq Overflow', coins: 95, appearance: { shirtColor: '#39CF61', trouserColor: '#174D5C' } },
  { name: 'Giannis Antetokounmpo', coins: 70, appearance: { shirtColor: '#FF9F0A', trouserColor: '#193A46' } },
];

export class GameStorageService {
  // In-memory cache for fast sync reads
  private memoryCache: {
    players: Map<string, Player>;
    applications: Map<string, Application>;
    employments: Map<string, Employment>;
    assignments: Map<string, Assignment>;
    transactions: Map<string, CoinTransaction>;
  } = {
    players: new Map(),
    applications: new Map(),
    employments: new Map(),
    assignments: new Map(),
    transactions: new Map(),
  };

  constructor() {
    this.hydrateFromLocalStorage();
  }

  public clearForTesting() {
    this.memoryCache.players.clear();
    this.memoryCache.applications.clear();
    this.memoryCache.employments.clear();
    this.memoryCache.assignments.clear();
    this.memoryCache.transactions.clear();
  }

  private hydrateFromLocalStorage() {
    try {
      const rawPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (rawPlayers) {
        const list: Player[] = JSON.parse(rawPlayers);
        list.forEach((p) => this.memoryCache.players.set(p.id, p));
      }

      const rawApps = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      if (rawApps) {
        const list: Application[] = JSON.parse(rawApps);
        list.forEach((a) => this.memoryCache.applications.set(a.id, a));
      }

      const rawEmps = localStorage.getItem(STORAGE_KEYS.EMPLOYMENTS);
      if (rawEmps) {
        const list: Employment[] = JSON.parse(rawEmps);
        list.forEach((e) => this.memoryCache.employments.set(e.id, e));
      }

      const rawAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (rawAssignments) {
        const list: Assignment[] = JSON.parse(rawAssignments);
        list.forEach((a) => this.memoryCache.assignments.set(a.id, a));
      }

      const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (rawTx) {
        const list: CoinTransaction[] = JSON.parse(rawTx);
        list.forEach((t) => this.memoryCache.transactions.set(t.id, t));
      }
    } catch {
      // Storage might be restricted or empty
    }
  }

  private persistToLocalStorage(key: string, data: unknown[]) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // Ignore storage quota
    }
  }

  // --- PLAYERS ---

  async getOrCreatePlayer(authUserId: string, displayName: string): Promise<Player> {
    // If Supabase is configured, sync with players table
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('auth_subject', authUserId)
          .maybeSingle();

        if (data) {
          const p: Player = {
            id: data.id,
            platform_user_id: data.platform_user_id,
            auth_subject: data.auth_subject,
            display_name: data.display_name,
            character_config: data.character_config || DEFAULT_CHARACTER_APPEARANCE,
            created_at: data.created_at,
            updated_at: data.updated_at,
            total_coins: data.total_coins || 0,
          };
          this.memoryCache.players.set(p.id, p);
          return p;
        }
      } catch (err) {
        console.warn('Supabase player fetch failed, continuing with local store:', err);
      }
    }

    // Local / Dev store
    for (const p of this.memoryCache.players.values()) {
      if (p.auth_subject === authUserId || p.id === authUserId) {
        return p;
      }
    }

    const newPlayer: Player = {
      id: authUserId,
      platform_user_id: null,
      auth_subject: authUserId,
      display_name: displayName || 'Hoops Rookie',
      character_config: { ...DEFAULT_CHARACTER_APPEARANCE },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_coins: 0,
    };

    this.memoryCache.players.set(newPlayer.id, newPlayer);
    this.persistToLocalStorage(STORAGE_KEYS.PLAYERS, Array.from(this.memoryCache.players.values()));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('players').insert({
          id: newPlayer.id,
          auth_subject: newPlayer.auth_subject,
          display_name: newPlayer.display_name,
          character_config: newPlayer.character_config,
          total_coins: 0,
        });
      } catch (err) {
        console.warn('Supabase player insert fallback:', err);
      }
    }

    return newPlayer;
  }

  async savePlayerAppearance(playerId: string, config: CharacterAppearance): Promise<void> {
    const player = this.memoryCache.players.get(playerId);
    if (player) {
      player.character_config = config;
      player.updated_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.PLAYERS, Array.from(this.memoryCache.players.values()));
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('players')
          .update({ character_config: config, updated_at: new Date().toISOString() })
          .eq('id', playerId);
      } catch (err) {
        console.warn('Supabase appearance update failed:', err);
      }
    }
  }

  async updateDisplayName(playerId: string, name: string): Promise<void> {
    const player = this.memoryCache.players.get(playerId);
    if (player) {
      player.display_name = name;
      player.updated_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.PLAYERS, Array.from(this.memoryCache.players.values()));
    }
  }

  // --- EMPLOYMENT ---

  async getActiveEmployment(playerId: string): Promise<Employment | null> {
    // Only one active or paused job per player
    for (const emp of this.memoryCache.employments.values()) {
      if (emp.player_id === playerId && (emp.status === 'active' || emp.status === 'paused')) {
        return emp;
      }
    }
    return null;
  }

  async getEmploymentHistory(playerId: string): Promise<Employment[]> {
    return Array.from(this.memoryCache.employments.values()).filter((e) => e.player_id === playerId);
  }

  async startEmployment(playerId: string, companyId: string, roleTitle: string): Promise<Employment> {
    // End any existing active/paused job
    for (const emp of this.memoryCache.employments.values()) {
      if (emp.player_id === playerId && (emp.status === 'active' || emp.status === 'paused')) {
        emp.status = 'ended';
        emp.ended_at = new Date().toISOString();
        emp.updated_at = new Date().toISOString();
      }
    }

    const newEmp: Employment = {
      id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      player_id: playerId,
      company_id: companyId,
      role_title: roleTitle,
      status: 'active',
      started_at: new Date().toISOString(),
      ended_at: null,
      updated_at: new Date().toISOString(),
    };

    this.memoryCache.employments.set(newEmp.id, newEmp);
    this.persistToLocalStorage(STORAGE_KEYS.EMPLOYMENTS, Array.from(this.memoryCache.employments.values()));

    // Seed assignments for this company if none exist for this employment
    await this.initAssignmentsForEmployment(newEmp.id, companyId);

    return newEmp;
  }

  async pauseEmployment(employmentId: string): Promise<Employment | null> {
    const emp = this.memoryCache.employments.get(employmentId);
    if (emp && emp.status === 'active') {
      emp.status = 'paused';
      emp.updated_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.EMPLOYMENTS, Array.from(this.memoryCache.employments.values()));
      return emp;
    }
    return null;
  }

  async resumeEmployment(employmentId: string): Promise<Employment | null> {
    const emp = this.memoryCache.employments.get(employmentId);
    if (emp && emp.status === 'paused') {
      emp.status = 'active';
      emp.updated_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.EMPLOYMENTS, Array.from(this.memoryCache.employments.values()));
      return emp;
    }
    return null;
  }

  async quitEmployment(employmentId: string): Promise<Employment | null> {
    const emp = this.memoryCache.employments.get(employmentId);
    if (emp && (emp.status === 'active' || emp.status === 'paused')) {
      emp.status = 'ended';
      emp.ended_at = new Date().toISOString();
      emp.updated_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.EMPLOYMENTS, Array.from(this.memoryCache.employments.values()));
      return emp;
    }
    return null;
  }

  // --- APPLICATIONS ---

  async getApplications(playerId: string): Promise<Application[]> {
    return Array.from(this.memoryCache.applications.values())
      .filter((a) => a.player_id === playerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async createApplication(
    playerId: string,
    companyId: string,
    shotId: string,
    simulatedStatus: Application['status'] = 'submitted'
  ): Promise<Application> {
    const app: Application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      player_id: playerId,
      company_id: companyId,
      status: simulatedStatus,
      shot_id: shotId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.memoryCache.applications.set(app.id, app);
    this.persistToLocalStorage(STORAGE_KEYS.APPLICATIONS, Array.from(this.memoryCache.applications.values()));
    return app;
  }

  async updateApplicationStatus(applicationId: string, status: Application['status']): Promise<Application | null> {
    const app = this.memoryCache.applications.get(applicationId);
    if (app) {
      app.status = status;
      app.updated_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.APPLICATIONS, Array.from(this.memoryCache.applications.values()));
      return app;
    }
    return null;
  }

  // --- ASSIGNMENTS ---

  private async initAssignmentsForEmployment(employmentId: string, companyId: string) {
    const templates = INITIAL_ASSIGNMENT_TEMPLATES[companyId] || [];
    templates.forEach((tmpl, idx) => {
      const assignmentId = `assign_${employmentId}_${idx}`;
      if (!this.memoryCache.assignments.has(assignmentId)) {
        const assign: Assignment = {
          id: assignmentId,
          employment_id: employmentId,
          template_id: tmpl.template_id,
          title: tmpl.title,
          description: tmpl.description,
          deliverable_name: tmpl.deliverable_name,
          difficulty: tmpl.difficulty,
          reward_coins: tmpl.reward_coins,
          status: 'available',
          completed_at: null,
        };
        this.memoryCache.assignments.set(assign.id, assign);
      }
    });
    this.persistToLocalStorage(STORAGE_KEYS.ASSIGNMENTS, Array.from(this.memoryCache.assignments.values()));
  }

  async getAssignmentsForEmployment(employmentId: string): Promise<Assignment[]> {
    return Array.from(this.memoryCache.assignments.values()).filter((a) => a.employment_id === employmentId);
  }

  // --- COIN REWARDS & TRANSACTIONS ---

  async getPlayerBalance(playerId: string): Promise<number> {
    const player = this.memoryCache.players.get(playerId);
    if (player) {
      return player.total_coins;
    }
    return 0;
  }

  async getCoinTransactionByIdempotencyKey(key: string): Promise<CoinTransaction | null> {
    for (const tx of this.memoryCache.transactions.values()) {
      if (tx.idempotency_key === key) {
        return tx;
      }
    }
    return null;
  }

  async recordCoinTransactionAndCompleteAssignment(
    playerId: string,
    assignmentId: string,
    transaction: CoinTransaction
  ): Promise<number> {
    // 1. Mark assignment completed
    const assign = this.memoryCache.assignments.get(assignmentId);
    if (assign) {
      assign.status = 'completed';
      assign.completed_at = new Date().toISOString();
      this.persistToLocalStorage(STORAGE_KEYS.ASSIGNMENTS, Array.from(this.memoryCache.assignments.values()));
    }

    // 2. Add transaction
    this.memoryCache.transactions.set(transaction.id, transaction);
    this.persistToLocalStorage(STORAGE_KEYS.TRANSACTIONS, Array.from(this.memoryCache.transactions.values()));

    // 3. Update player total balance
    const player = this.memoryCache.players.get(playerId);
    let newBalance = transaction.amount;
    if (player) {
      player.total_coins += transaction.amount;
      player.updated_at = new Date().toISOString();
      newBalance = player.total_coins;
      this.persistToLocalStorage(STORAGE_KEYS.PLAYERS, Array.from(this.memoryCache.players.values()));
    }

    return newBalance;
  }

  // --- LEADERBOARD ---

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Collect saved real players
    const entries: LeaderboardEntry[] = [];

    // Real players from cache
    for (const p of this.memoryCache.players.values()) {
      entries.push({
        rank: 0,
        player_id: p.id,
        display_name: p.display_name,
        character_config: p.character_config,
        total_coins: p.total_coins,
        updated_at: p.updated_at,
      });
    }

    // Seeded community players (if fewer than 5 players to populate a lively arcade board)
    SEEDED_LEADERBOARD_PLAYERS.forEach((seed, idx) => {
      // Don't duplicate if already present
      if (!entries.some((e) => e.display_name === seed.name)) {
        entries.push({
          rank: 0,
          player_id: `seed_${idx}`,
          display_name: `${seed.name} (Dev Seed)`,
          character_config: {
            ...DEFAULT_CHARACTER_APPEARANCE,
            ...seed.appearance,
          },
          total_coins: seed.coins,
          updated_at: new Date().toISOString(),
        });
      }
    });

    // Sort descending by total_coins, then earliest updated_at
    entries.sort((a, b) => {
      if (b.total_coins !== a.total_coins) {
        return b.total_coins - a.total_coins;
      }
      return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    });

    // Assign 1-indexed ranks
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return entries;
  }
}

export const gameStorage = new GameStorageService();
