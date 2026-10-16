import { describe, it, expect, beforeEach } from 'vitest';
import { rewardService } from './rewardService';
import { gameStorage } from './gameStorage';
import { Assignment, Employment } from '@/types/game';

describe('RewardService & Idempotency', () => {
  const playerId = 'test-player-123';

  beforeEach(async () => {
    localStorage.clear();
    gameStorage.clearForTesting();
    await gameStorage.getOrCreatePlayer(playerId, 'Test Player');
  });

  const mockActiveEmployment: Employment = {
    id: 'emp-active-1',
    player_id: playerId,
    company_id: 'comp_cloudbounce',
    role_title: 'Full Stack Engineer',
    status: 'active',
    started_at: new Date().toISOString(),
    ended_at: null,
    updated_at: new Date().toISOString(),
  };

  const createAssignment = (id: string): Assignment => ({
    id,
    employment_id: 'emp-active-1',
    template_id: 'cb_task_1',
    title: 'Deploy Zero-Downtime Worker',
    description: 'Ship containerized background tasks',
    deliverable_name: 'Docker Image Container',
    difficulty: 'Easy',
    reward_coins: 10,
    status: 'available',
    completed_at: null,
  });

  it('successfully awards coins for an active employment task', async () => {
    const task = createAssignment('task-1');
    const result = await rewardService.claimAssignmentReward(
      playerId,
      mockActiveEmployment,
      task
    );

    expect(result.success).toBe(true);
    expect(result.coinsAwarded).toBe(10);
    expect(result.newTotalCoins).toBe(10);
  });

  it('blocks rewards when employment is paused', async () => {
    const pausedEmployment: Employment = {
      ...mockActiveEmployment,
      status: 'paused',
    };

    const task = createAssignment('task-2');
    const result = await rewardService.claimAssignmentReward(
      playerId,
      pausedEmployment,
      task
    );

    expect(result.success).toBe(false);
    expect(result.coinsAwarded).toBe(0);
    expect(result.error).toContain('paused');
  });

  it('blocks rewards when employment is ended / quit', async () => {
    const endedEmployment: Employment = {
      ...mockActiveEmployment,
      status: 'ended',
    };

    const task = createAssignment('task-3');
    const result = await rewardService.claimAssignmentReward(
      playerId,
      endedEmployment,
      task
    );

    expect(result.success).toBe(false);
    expect(result.coinsAwarded).toBe(0);
    expect(result.error).toContain('ended');
  });

  it('prevents double payouts on retried reward claims (idempotency)', async () => {
    const task = createAssignment('task-4');
    // 1st claim
    const firstResult = await rewardService.claimAssignmentReward(
      playerId,
      mockActiveEmployment,
      task
    );
    expect(firstResult.success).toBe(true);
    expect(firstResult.newTotalCoins).toBe(10);

    // 2nd identical claim attempt (e.g. repeated network call)
    const secondResult = await rewardService.claimAssignmentReward(
      playerId,
      mockActiveEmployment,
      task
    );

    expect(secondResult.success).toBe(false);
    expect(secondResult.coinsAwarded).toBe(0);
    expect(secondResult.newTotalCoins).toBe(10); // Balance not incremented!
  });
});
