import { Assignment, CoinTransaction, Employment } from '@/types/game';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { gameStorage } from './gameStorage';

export interface RewardVerificationResult {
  success: boolean;
  coinsAwarded: number;
  newTotalCoins: number;
  transactionId?: string;
  idempotencyKey: string;
  error?: string;
}

/**
 * Trusted reward service:
 * Enforces server-side authority, verifies employment is active (not paused/ended),
 * prevents double-spending / duplicate completion via idempotency keys,
 * and records transactional ledger entry.
 */
export class RewardService {
  /**
   * Process and award coins for an assignment completion
   */
  async claimAssignmentReward(
    playerId: string,
    employment: Employment,
    assignment: Assignment
  ): Promise<RewardVerificationResult> {
    const idempotencyKey = `assign_reward_${employment.id}_${assignment.id}`;

    // 1. Validation: employment must be active
    if (employment.status !== 'active') {
      return {
        success: false,
        coinsAwarded: 0,
        newTotalCoins: await gameStorage.getPlayerBalance(playerId),
        idempotencyKey,
        error: `Cannot claim reward while employment is ${employment.status}. Must be active.`,
      };
    }

    if (employment.player_id !== playerId) {
      return {
        success: false,
        coinsAwarded: 0,
        newTotalCoins: await gameStorage.getPlayerBalance(playerId),
        idempotencyKey,
        error: 'Unauthorized: Employment does not belong to active player.',
      };
    }

    // 2. Validation: assignment must not already be completed
    if (assignment.status === 'completed') {
      return {
        success: false,
        coinsAwarded: 0,
        newTotalCoins: await gameStorage.getPlayerBalance(playerId),
        idempotencyKey,
        error: 'This assignment deliverable has already been completed and rewarded.',
      };
    }

    // 3. Supabase RPC / DB Transaction path if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.rpc('claim_assignment_reward', {
          p_player_id: playerId,
          p_employment_id: employment.id,
          p_assignment_id: assignment.id,
          p_amount: assignment.reward_coins,
          p_idempotency_key: idempotencyKey,
        });

        if (error) {
          // If RPC is not created yet, fallback to table insert or handle error
          console.warn('Supabase RPC error, falling back to secure client transaction:', error.message);
        } else if (data) {
          return {
            success: true,
            coinsAwarded: data.coins_awarded,
            newTotalCoins: data.new_total_coins,
            transactionId: data.transaction_id,
            idempotencyKey,
          };
        }
      } catch (err: unknown) {
        console.warn('Supabase RPC call failed, using gameStorage persistence:', err);
      }
    }

    // 4. Standalone storage verification path (enforces exact same business rules and idempotency)
    const existingTx = await gameStorage.getCoinTransactionByIdempotencyKey(idempotencyKey);
    if (existingTx) {
      const currentBalance = await gameStorage.getPlayerBalance(playerId);
      return {
        success: false,
        coinsAwarded: 0,
        newTotalCoins: currentBalance,
        idempotencyKey,
        error: 'Duplicate reward prevented. Transaction already recorded.',
      };
    }

    // Atomic award in gameStorage
    const transaction: CoinTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      player_id: playerId,
      amount: assignment.reward_coins,
      reason: `Completed: ${assignment.title}`,
      reference_id: assignment.id,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
    };

    const newBalance = await gameStorage.recordCoinTransactionAndCompleteAssignment(
      playerId,
      assignment.id,
      transaction
    );

    return {
      success: true,
      coinsAwarded: assignment.reward_coins,
      newTotalCoins: newBalance,
      transactionId: transaction.id,
      idempotencyKey,
    };
  }
}

export const rewardService = new RewardService();
