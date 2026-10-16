import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Assignment, Company, Employment } from '@/types/game';
import { ShotEvaluation } from '@/game/engine/ShotEvaluator';
import { rewardService } from '@/services/rewardService';
import { ArcadeButton } from '@/components/ArcadeButton';
import { ArcadeCard } from '@/components/ArcadeCard';
import {
  ArrowLeft,
  Coins,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Award,
  Clock,
  Star,
  Briefcase,
  Pause,
  Lock,
  Unlock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkingModeProps {
  playerId: string;
  employment: Employment;
  company: Company;
  assignments: Assignment[];
  onAssignmentCompleted: (assignmentId: string, newBalance: number) => void;
  onExitToDashboard: () => void;
  onApplyToOtherJobs?: () => void;
  onTakeBreak?: () => Promise<void>;
  onRegisterShotHandler: (handler: (evaluation: ShotEvaluation) => void) => void;
  onPlaySwish: () => void;
  onPlayRimClank: () => void;
  onPlayCoinDing: () => void;
  onPlayFanfare: () => void;
}

const DELIVERABLE_TIME_LIMIT = 20; // 20 seconds per deliverable
const DAILY_TARGET_QUOTA = 5; // 5 out of 10 deliverables required to unlock coins

export const WorkingMode: React.FC<WorkingModeProps> = ({
  playerId,
  employment,
  company,
  assignments,
  onAssignmentCompleted,
  onExitToDashboard,
  onApplyToOtherJobs,
  onTakeBreak,
  onRegisterShotHandler,
  onPlaySwish,
  onPlayRimClank,
  onPlayCoinDing,
  onPlayFanfare,
}) => {
  const [isClaimingReward, setIsClaimingReward] = useState(false);

  // Deliverable Mini-Timer
  const [timeLeft, setTimeLeft] = useState<number>(DELIVERABLE_TIME_LIMIT);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(true);

  // Daily quota tracking and stars
  const todayKey = `job_hunt_daily_${playerId}_${new Date().toISOString().slice(0, 10)}`;
  const [stars, setStars] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${todayKey}_stars`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Staged coins accumulated before hitting 5/10 quota
  const [stagedCoins, setStagedCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${todayKey}_staged_coins`);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [activeFeedback, setActiveFeedback] = useState<{
    show: boolean;
    success: boolean;
    title: string;
    description: string;
    starsAwarded?: number;
    coinsAwarded?: number;
    quotaMessage?: string;
  }>({
    show: false,
    success: false,
    title: '',
    description: '',
  });

  const availableAssignments = assignments.filter((a) => a.status === 'available');
  const completedAssignments = assignments.filter((a) => a.status === 'completed');
  const completedCount = completedAssignments.length;
  const currentAssignment = availableAssignments[0] || null;

  const currentAssignmentRef = useRef<Assignment | null>(currentAssignment);
  currentAssignmentRef.current = currentAssignment;

  const isQuotaUnlocked = completedCount >= DAILY_TARGET_QUOTA;

  // Save stars & staged coins to storage
  useEffect(() => {
    try {
      localStorage.setItem(`${todayKey}_stars`, stars.toString());
      localStorage.setItem(`${todayKey}_staged_coins`, stagedCoins.toString());
    } catch {
      // ignore
    }
  }, [stars, stagedCoins, todayKey]);

  // Mini-Timer Tick
  useEffect(() => {
    if (!isTimerActive || activeFeedback.show || !currentAssignment) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired on this deliverable attempt
          onPlayRimClank();
          setActiveFeedback({
            show: true,
            success: false,
            title: "TIME'S UP!",
            description: `Deliverable timer expired! The client at ${company.name} expects fast turnarounds. Re-align and shoot quickly!`,
          });
          return DELIVERABLE_TIME_LIMIT;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, activeFeedback.show, currentAssignment, company.name, onPlayRimClank]);

  // Called from GameCanvas when deliverable hits or misses
  const handleDeliverableShotEvaluated = useCallback(
    async (evaluation: ShotEvaluation) => {
      const task = currentAssignmentRef.current;
      if (!task || isClaimingReward) return;

      if (evaluation.success) {
        onPlaySwish();
        setIsClaimingReward(true);
        setIsTimerActive(false);

        // Compute Stars based on speed & precision
        let starsAwarded = 1;
        if (timeLeft >= 12 || evaluation.isSwish) {
          starsAwarded = 3;
        } else if (timeLeft >= 6) {
          starsAwarded = 2;
        }

        const newStars = stars + starsAwarded;
        setStars(newStars);

        const newCompletedCount = completedCount + 1;
        const reachedQuotaNow = newCompletedCount === DAILY_TARGET_QUOTA;
        const alreadyAboveQuota = newCompletedCount > DAILY_TARGET_QUOTA;

        try {
          if (reachedQuotaNow || alreadyAboveQuota) {
            // Player reached 5/10! Claim server-authoritative reward + any staged coins
            const totalRewardCoins = reachedQuotaNow
              ? task.reward_coins + stagedCoins
              : task.reward_coins;

            const rewardResult = await rewardService.claimAssignmentReward(
              playerId,
              employment,
              task
            );

            if (rewardResult.success) {
              onPlayCoinDing();
              onPlayFanfare();
              try {
                confetti({
                  particleCount: 80,
                  spread: 80,
                  origin: { y: 0.6 },
                });
              } catch {
                // ignore
              }

              // Clear staged coins since they are now claimed
              setStagedCoins(0);
              onAssignmentCompleted(task.id, rewardResult.newTotalCoins);

              setActiveFeedback({
                show: true,
                success: true,
                title: reachedQuotaNow
                  ? '🎯 QUOTA UNLOCKED! 5/10 DELIVERABLES REACHED!'
                  : evaluation.isSwish
                  ? 'PERFECT SWISH! DELIVERABLE SHIPPED!'
                  : 'DELIVERABLE ACCEPTED!',
                description: reachedQuotaNow
                  ? `Incredible dedication! You completed 5 deliverables today and unlocked ${totalRewardCoins} coins for your wallet!`
                  : `Shipped "${task.deliverable_name}" to ${company.name} in record time!`,
                starsAwarded,
                coinsAwarded: totalRewardCoins,
                quotaMessage: `${newCompletedCount}/10 Daily Deliverables Complete`,
              });
            } else {
              setActiveFeedback({
                show: true,
                success: false,
                title: 'Reward Verification Issue',
                description: rewardResult.error || 'Could not verify deliverable reward.',
              });
            }
          } else {
            // completedCount < 5: Stage the coins until they hit 5/10!
            const newStaged = stagedCoins + task.reward_coins;
            setStagedCoins(newStaged);

            // Mark assignment locally as completed in sprint
            onAssignmentCompleted(task.id, await rewardService.claimAssignmentReward(playerId, employment, task).then(r => r.newTotalCoins).catch(() => 0));

            onPlayCoinDing();
            setActiveFeedback({
              show: true,
              success: true,
              title: 'DELIVERABLE SHIPPED!',
              description: `Great shot! "${task.deliverable_name}" accepted by ${company.name}.`,
              starsAwarded,
              quotaMessage: `Daily Progress: ${newCompletedCount}/10 Deliverables (Need ${DAILY_TARGET_QUOTA - newCompletedCount} more to unlock coins!)`,
            });
          }
        } catch (err: unknown) {
          console.error('Failed to claim reward:', err);
          setActiveFeedback({
            show: true,
            success: false,
            title: 'Reward Error',
            description: 'A network error occurred while verifying the deliverable reward.',
          });
        } finally {
          setIsClaimingReward(false);
        }
      } else {
        onPlayRimClank();
        setActiveFeedback({
          show: true,
          success: false,
          title: evaluation.rimHit ? 'OFF THE RIM!' : 'DELIVERABLE MISSED!',
          description: 'Re-align your aim and shoot the deliverable package into the hoop!',
        });
      }
    },
    [
      completedCount,
      company.name,
      employment,
      isClaimingReward,
      onAssignmentCompleted,
      onPlayCoinDing,
      onPlayFanfare,
      onPlayRimClank,
      onPlaySwish,
      playerId,
      stagedCoins,
      stars,
      timeLeft,
    ]
  );

  useEffect(() => {
    onRegisterShotHandler(handleDeliverableShotEvaluated);
  }, [onRegisterShotHandler, handleDeliverableShotEvaluated]);

  const handleDismissFeedback = () => {
    setActiveFeedback((prev) => ({ ...prev, show: false }));
    setTimeLeft(DELIVERABLE_TIME_LIMIT);
    setIsTimerActive(true);
  };

  const timerRatio = timeLeft / DELIVERABLE_TIME_LIMIT;
  const isUrgentTimer = timeLeft <= 5;

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="working-top-nav">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={onExitToDashboard}
            className="arcade-btn arcade-btn-secondary arcade-btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.82rem' }}
            title="Return to Home Dashboard"
          >
            <ArrowLeft size={16} />
            <span className="nav-btn-text-full">Dashboard</span>
            <span className="nav-btn-text-short">Back</span>
          </button>

          {onTakeBreak && (
            <button
              onClick={async () => {
                await onTakeBreak();
                onExitToDashboard();
              }}
              className="arcade-btn arcade-btn-secondary arcade-btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.82rem' }}
              title="Pause current job and take a break"
            >
              <Pause size={14} />
              <span className="nav-btn-text-full">Take a Break</span>
              <span className="nav-btn-text-short">Break</span>
            </button>
          )}
        </div>

        {/* Apply to Other Jobs Button */}
        {onApplyToOtherJobs && (
          <button
            onClick={onApplyToOtherJobs}
            className="arcade-btn arcade-btn-accent arcade-btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: 800,
            }}
            title="Browse and apply to other company hoops"
          >
            <Briefcase size={15} />
            <span className="nav-btn-text-full">Apply to Other Jobs</span>
            <span className="nav-btn-text-short">Other Jobs</span>
          </button>
        )}
      </div>

      {/* Center Deliverable & Quota Arcade HUD */}
      <div className="working-hud-center">
        {/* Company and Daily Target Banner */}
        <div
          style={{
            background: 'rgba(25, 58, 70, 0.94)',
            backdropFilter: 'blur(6px)',
            border: `2px solid ${company.accent_color}`,
            borderRadius: 'var(--radius-pill)',
            padding: '5px 16px',
            color: '#FFFFFF',
            fontSize: '0.82rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            width: '100%',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: company.accent_color, flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {company.name}
            </span>
          </div>

          {/* Daily 5/10 Target Quota */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isQuotaUnlocked ? '#197A3B' : 'rgba(10, 29, 36, 0.7)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-pill)',
              border: `1px solid ${isQuotaUnlocked ? '#82E4A1' : 'var(--color-golden-yellow)'}`,
              fontSize: '0.75rem',
              fontWeight: 800,
              color: isQuotaUnlocked ? '#FFFFFF' : 'var(--color-golden-yellow)',
            }}
          >
            {isQuotaUnlocked ? <Unlock size={12} /> : <Lock size={12} />}
            <span>Deliverables: {completedCount}/10</span>
          </div>

          {/* Stars Collected */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: 'var(--color-golden-yellow)',
              fontWeight: 900,
              fontSize: '0.8rem',
            }}
          >
            <Star size={14} fill="var(--color-golden-yellow)" />
            <span>{stars}</span>
          </div>
        </div>

        {/* Mini-Timer Countdown Bar */}
        {currentAssignment && !activeFeedback.show && (
          <div
            style={{
              width: '100%',
              background: 'rgba(16, 47, 58, 0.92)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 12px',
              border: `2px solid ${isUrgentTimer ? 'var(--color-coral)' : 'var(--color-muted)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: isUrgentTimer ? 'var(--color-coral)' : '#FFE85A',
                fontWeight: 900,
                fontSize: '0.85rem',
                flexShrink: 0,
              }}
            >
              <Clock size={16} className={isUrgentTimer ? 'coin-icon-spin' : ''} />
              <span>{timeLeft}s</span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                flex: 1,
                height: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${timerRatio * 100}%`,
                  height: '100%',
                  background: isUrgentTimer
                    ? 'var(--color-coral)'
                    : timerRatio > 0.4
                    ? 'var(--color-golden-yellow)'
                    : 'var(--color-cyan)',
                  borderRadius: 'var(--radius-pill)',
                  transition: 'width 1s linear',
                }}
              />
            </div>

            <span
              style={{
                fontSize: '0.72rem',
                color: '#FFFFFF',
                fontWeight: 800,
                whiteSpace: 'nowrap',
              }}
            >
              {timeLeft >= 12 ? '⭐⭐⭐ Fast' : timeLeft >= 6 ? '⭐⭐ Good' : '⭐ Hurry!'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Assignment Card and Controls */}
      <div className="bottom-overlay">
        {!activeFeedback.show && currentAssignment && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '520px',
            }}
          >
            {/* Deliverable instruction banner */}
            <div className="aim-banner" style={{ background: 'rgba(25, 58, 70, 0.95)', border: `2px solid ${company.accent_color}` }}>
              📦 Shoot your deliverable ({currentAssignment.deliverable_name}) into {company.name}&apos;s hoop!
            </div>

            {/* Current assignment detail card */}
            <div
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.96)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 18px',
                border: `3px solid ${isQuotaUnlocked ? 'var(--color-green)' : 'var(--color-teal-dark)'}`,
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <PackageCheck size={18} color="var(--color-green-dark)" />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-ink)' }}>
                    {currentAssignment.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: 'var(--color-cloud)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      color: 'var(--color-teal)',
                    }}
                  >
                    Task #{completedCount + 1}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-teal)', fontWeight: 600 }}>
                  {currentAssignment.description}
                </div>
              </div>

              {/* Reward badge */}
              <div
                style={{
                  background: isQuotaUnlocked ? 'var(--color-golden-yellow)' : 'var(--color-cloud)',
                  color: 'var(--color-navy)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: `2px solid ${isQuotaUnlocked ? 'var(--color-orange)' : 'var(--color-muted)'}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Coins size={16} />
                +{currentAssignment.reward_coins}
                {!isQuotaUnlocked && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-coral-dark)' }}>
                    (5/10 needed)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All 10 assignments completed in current sprint */}
        {!activeFeedback.show && !currentAssignment && (
          <ArcadeCard
            style={{
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              border: '3px solid var(--color-golden-yellow)',
              boxShadow: 'var(--shadow-modal)',
              padding: '24px',
            }}
          >
            <Award size={48} color="var(--color-golden-yellow)" style={{ margin: '0 auto 10px' }} />
            <h3 style={{ color: 'var(--color-ink)', marginBottom: '8px', fontSize: '1.3rem' }}>
              All 10 Deliverables Completed!
            </h3>
            <p style={{ color: 'var(--color-teal)', fontSize: '0.92rem', marginBottom: '18px' }}>
              Mastery achieved at {company.name}! You&apos;ve completed all 10 deliverables for the day, earned {stars} Stars, and collected all coins!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <ArcadeButton variant="primary" size="sm" onClick={onExitToDashboard}>
                Return to Dashboard
              </ArcadeButton>
              {onApplyToOtherJobs && (
                <ArcadeButton variant="accent" size="sm" onClick={onApplyToOtherJobs}>
                  Apply to Other Jobs
                </ArcadeButton>
              )}
            </div>
          </ArcadeCard>
        )}

        {/* Deliverable feedback popup */}
        {activeFeedback.show && (
          <ArcadeCard
            style={{
              width: '100%',
              maxWidth: '460px',
              border: `3px solid ${activeFeedback.success ? 'var(--color-green)' : 'var(--color-coral)'}`,
              boxShadow: 'var(--shadow-modal)',
              textAlign: 'center',
              padding: '20px',
              animation: 'pop-in 180ms ease-out',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              {activeFeedback.success ? (
                <CheckCircle2 size={44} color="var(--color-green)" style={{ margin: '0 auto' }} />
              ) : (
                <XCircle size={44} color="var(--color-coral)" style={{ margin: '0 auto' }} />
              )}
            </div>

            <h3
              style={{
                fontSize: '1.25rem',
                color: activeFeedback.success ? 'var(--color-green-dark)' : 'var(--color-coral-dark)',
                marginBottom: '6px',
              }}
            >
              {activeFeedback.title}
            </h3>

            <p style={{ fontSize: '0.92rem', color: 'var(--color-ink)', marginBottom: '12px', lineHeight: 1.4 }}>
              {activeFeedback.description}
            </p>

            {/* Stars Awarded */}
            {activeFeedback.starsAwarded && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginBottom: '12px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  color: 'var(--color-orange)',
                }}
              >
                {Array.from({ length: activeFeedback.starsAwarded }).map((_, i) => (
                  <Star key={i} size={22} fill="var(--color-golden-yellow)" color="var(--color-orange)" />
                ))}
                <span>+{activeFeedback.starsAwarded} Stars!</span>
              </div>
            )}

            {/* Coins Awarded / Staged */}
            {activeFeedback.coinsAwarded !== undefined && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'var(--color-golden-yellow)',
                  color: 'var(--color-navy)',
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 900,
                  fontSize: '1.2rem',
                  marginBottom: '16px',
                  border: '2px solid var(--color-orange)',
                }}
              >
                <Coins size={22} />
                +{activeFeedback.coinsAwarded} Coins Earned!
              </div>
            )}

            {/* Quota Message */}
            {activeFeedback.quotaMessage && (
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: isQuotaUnlocked ? 'var(--color-green-dark)' : 'var(--color-coral-dark)',
                  background: 'var(--color-cloud)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  marginBottom: '16px',
                  display: 'inline-block',
                }}
              >
                {activeFeedback.quotaMessage}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <ArcadeButton
                variant={activeFeedback.success ? 'success' : 'secondary'}
                size="sm"
                onClick={handleDismissFeedback}
              >
                {activeFeedback.success ? 'Next Deliverable' : 'Retry Shot'}
              </ArcadeButton>

              <ArcadeButton variant="secondary" size="sm" onClick={onExitToDashboard}>
                Dashboard
              </ArcadeButton>
            </div>
          </ArcadeCard>
        )}
      </div>
    </>
  );
};
