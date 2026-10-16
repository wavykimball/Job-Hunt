import { describe, it, expect, beforeEach } from 'vitest';
import { gameStorage } from './gameStorage';
import { normalizeCharacterAppearance, DEFAULT_CHARACTER_APPEARANCE } from '@/integrations/character/CharacterAppearance';

describe('GameStorage & Business Rules', () => {
  const playerId = 'player-storage-test';

  beforeEach(() => {
    localStorage.clear();
    gameStorage.clearForTesting();
  });

  it('enforces at most one active or paused employment per player', async () => {
    // 1. Start Job A
    const jobA = await gameStorage.startEmployment(playerId, 'comp_cloudbounce', 'Full Stack Engineer');
    expect(jobA.status).toBe('active');

    let current = await gameStorage.getActiveEmployment(playerId);
    expect(current?.id).toBe(jobA.id);
    expect(current?.company_id).toBe('comp_cloudbounce');

    // 2. Pause Job A
    await gameStorage.pauseEmployment(jobA.id);
    current = await gameStorage.getActiveEmployment(playerId);
    expect(current?.status).toBe('paused');

    // 3. Start Job B (switching jobs ends previous active/paused job)
    const jobB = await gameStorage.startEmployment(playerId, 'comp_neongrid', 'Frontend Architect');
    expect(jobB.status).toBe('active');

    current = await gameStorage.getActiveEmployment(playerId);
    expect(current?.id).toBe(jobB.id);
    expect(current?.company_id).toBe('comp_neongrid');

    // Job A should now be ended in history
    const history = await gameStorage.getEmploymentHistory(playerId);
    const oldJobA = history.find((e) => e.id === jobA.id);
    expect(oldJobA?.status).toBe('ended');
    expect(oldJobA?.ended_at).not.toBeNull();
  });

  it('preserves player progress, coins and history upon quitting a job', async () => {
    await gameStorage.getOrCreatePlayer(playerId, 'Career Runner');
    const job = await gameStorage.startEmployment(playerId, 'comp_apex', 'Product Lead');

    // Record coins
    await gameStorage.recordCoinTransactionAndCompleteAssignment(playerId, 'test-task', {
      id: 'tx-1',
      player_id: playerId,
      amount: 25,
      reason: 'Assignment Completion',
      reference_id: 'test-task',
      idempotency_key: 'test-idemp-1',
      created_at: new Date().toISOString(),
    });

    const balanceBeforeQuit = await gameStorage.getPlayerBalance(playerId);
    expect(balanceBeforeQuit).toBe(25);

    // Quit job
    await gameStorage.quitEmployment(job.id);
    const current = await gameStorage.getActiveEmployment(playerId);
    expect(current).toBeNull();

    // Verify coins and history survived
    const balanceAfterQuit = await gameStorage.getPlayerBalance(playerId);
    expect(balanceAfterQuit).toBe(25);

    const history = await gameStorage.getEmploymentHistory(playerId);
    expect(history.length).toBe(1);
    expect(history[0].status).toBe('ended');
  });

  it('ensures public leaderboard never exposes sensitive auth data', async () => {
    const leaderboard = await gameStorage.getLeaderboard();
    expect(leaderboard.length).toBeGreaterThan(0);

    leaderboard.forEach((entry) => {
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('player_id');
      expect(entry).toHaveProperty('display_name');
      expect(entry).toHaveProperty('total_coins');
      expect(entry).toHaveProperty('character_config');

      // Ensure no private auth fields are exposed
      const record = entry as unknown as Record<string, unknown>;
      expect(record.email).toBeUndefined();
      expect(record.auth_subject).toBeUndefined();
      expect(record.token).toBeUndefined();
    });
  });

  it('normalizes character appearance with safe fallbacks', () => {
    const emptyNormalized = normalizeCharacterAppearance(null);
    expect(emptyNormalized.shirtColor).toBe(DEFAULT_CHARACTER_APPEARANCE.shirtColor);
    expect(emptyNormalized.modelId).toBe(DEFAULT_CHARACTER_APPEARANCE.modelId);

    const partialNormalized = normalizeCharacterAppearance({ shirtColor: '#08BFE8' });
    expect(partialNormalized.shirtColor).toBe('#08BFE8');
    expect(partialNormalized.trouserColor).toBe(DEFAULT_CHARACTER_APPEARANCE.trouserColor);
  });
});
