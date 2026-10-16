import React, { useState } from 'react';
import { ArcadeButton } from '@/components/ArcadeButton';
import { ArcadeCard } from '@/components/ArcadeCard';
import { Modal } from '@/components/Modal';
import { Employment, Company } from '@/types/game';
import { Briefcase, Play, Pause, LogOut, Building2, Palette } from 'lucide-react';

interface HomeDashboardProps {
  playerName: string;
  totalCoins: number;
  currentEmployment: Employment | null;
  employedCompany: Company | null;
  onStartJobHunting: () => void;
  onStartWorking: () => void;
  onPauseEmployment: () => Promise<void>;
  onResumeEmployment: () => Promise<void>;
  onQuitEmployment: () => Promise<void>;
  onOpenCharacterSetup: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  playerName,
  totalCoins,
  currentEmployment,
  employedCompany,
  onStartJobHunting,
  onStartWorking,
  onPauseEmployment,
  onResumeEmployment,
  onQuitEmployment,
  onOpenCharacterSetup,
}) => {
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const isEmployed = currentEmployment?.status === 'active';
  const isPaused = currentEmployment?.status === 'paused';
  const isUnemployed = !currentEmployment || currentEmployment.status === 'ended';

  const handleQuitConfirm = async () => {
    setIsProcessingAction(true);
    try {
      await onQuitEmployment();
      setShowQuitConfirm(false);
    } catch (err) {
      console.error('Failed to quit employment:', err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        pointerEvents: 'none',
        padding: 'var(--space-4)',
        zIndex: 20,
      }}
    >
      {/* Centered Arcade Dashboard Deck */}
      <div className="dashboard-deck-container">
        <ArcadeCard className="dashboard-deck-card">
          {/* Header row: Player greeting & employment badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-teal)', textTransform: 'uppercase' }}>
                Career Dashboard
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.4rem', color: 'var(--color-ink)', margin: 0 }}>
                  Welcome, {playerName}!
                </h2>
                <button
                  onClick={onOpenCharacterSetup}
                  className="arcade-btn arcade-btn-golden arcade-btn-sm arcade-btn-icon"
                  style={{ width: 28, height: 28, minHeight: 28 }}
                  title="Customize character appearance"
                >
                  <Palette size={14} />
                </button>
              </div>
            </div>

            {isUnemployed && (
              <span className="status-pill status-pill-unemployed">Unemployed</span>
            )}
            {isEmployed && (
              <span className="status-pill status-pill-employed">Employed</span>
            )}
            {isPaused && (
              <span className="status-pill status-pill-paused">On a Break</span>
            )}
          </div>

          {/* Active Employment Card Info (if employed or paused) */}
          {(isEmployed || isPaused) && employedCompany && (
            <div
              style={{
                background: 'var(--color-cloud)',
                border: '2px solid var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 'var(--radius-md)',
                    background: employedCompany.accent_color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                  }}
                >
                  <Building2 size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-ink)' }}>
                    {employedCompany.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                    Role: {currentEmployment?.role_title}
                  </div>
                </div>
              </div>

              {/* Pause / Resume action */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEmployed && (
                  <button
                    onClick={onPauseEmployment}
                    className="arcade-btn arcade-btn-secondary arcade-btn-sm"
                    title="Take a break from work"
                  >
                    <Pause size={14} /> Break
                  </button>
                )}
                {isPaused && (
                  <button
                    onClick={onResumeEmployment}
                    className="arcade-btn arcade-btn-golden arcade-btn-sm"
                    title="Resume working"
                  >
                    <Play size={14} /> Resume
                  </button>
                )}
                <button
                  onClick={() => setShowQuitConfirm(true)}
                  className="arcade-btn arcade-btn-danger arcade-btn-sm arcade-btn-icon"
                  title="Quit current job"
                  aria-label="Quit current job"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Primary & Secondary Call to Actions based on user state */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {isUnemployed && (
              <ArcadeButton
                variant="primary"
                fullWidth
                onClick={onStartJobHunting}
                style={{ fontSize: '1.15rem', padding: '16px 20px' }}
              >
                <Briefcase size={22} />
                Apply to Jobs
              </ArcadeButton>
            )}

            {isEmployed && (
              <>
                <ArcadeButton
                  variant="primary"
                  fullWidth
                  onClick={onStartWorking}
                  style={{ fontSize: '1.15rem', padding: '16px 20px' }}
                >
                  <Play size={22} />
                  Continue Working (Earn Coins)
                </ArcadeButton>

                <ArcadeButton
                  variant="accent"
                  fullWidth
                  onClick={onStartJobHunting}
                  size="sm"
                >
                  <Briefcase size={16} />
                  Apply to Other Jobs
                </ArcadeButton>
              </>
            )}

            {isPaused && (
              <>
                <ArcadeButton
                  variant="golden"
                  fullWidth
                  onClick={onResumeEmployment}
                  style={{ fontSize: '1.15rem', padding: '16px 20px' }}
                >
                  <Play size={22} />
                  Resume Work
                </ArcadeButton>

                <ArcadeButton
                  variant="accent"
                  fullWidth
                  onClick={onStartJobHunting}
                  size="sm"
                >
                  <Briefcase size={16} />
                  Apply to Other Jobs
                </ArcadeButton>
              </>
            )}
          </div>
        </ArcadeCard>

        {/* Quick hint card */}
        <div
          style={{
            background: 'rgba(25, 58, 70, 0.88)',
            backdropFilter: 'blur(4px)',
            color: 'var(--color-paper)',
            borderRadius: 'var(--radius-pill)',
            padding: '8px 18px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textAlign: 'center',
            border: '1.5px solid var(--color-cyan)',
          }}
        >
          {isUnemployed && '🏀 Drag backwards on the court to aim your CV at company hoops!'}
          {isEmployed && '💼 Submit deliverables into the hoop to earn coins for each completed task!'}
          {isPaused && '❚❚ On break: You retain your job, but cannot earn coins until resuming work.'}
        </div>
      </div>

      {/* Quit Job Confirmation Modal */}
      <Modal
        isOpen={showQuitConfirm}
        onClose={() => setShowQuitConfirm(false)}
        title="Quit Current Job?"
        headerVariant="coral"
        maxWidth={480}
        footer={
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
            <ArcadeButton
              variant="secondary"
              fullWidth
              size="sm"
              style={{ justifyContent: 'center', height: '42px', minHeight: '42px' }}
              onClick={() => setShowQuitConfirm(false)}
              disabled={isProcessingAction}
            >
              Stay at Job
            </ArcadeButton>
            <ArcadeButton
              variant="danger"
              fullWidth
              size="sm"
              style={{ justifyContent: 'center', height: '42px', minHeight: '42px' }}
              onClick={handleQuitConfirm}
              disabled={isProcessingAction}
            >
              {isProcessingAction ? 'Quitting...' : 'Yes, Quit Job'}
            </ArcadeButton>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '16px 8px 10px' }}>
          <h3 style={{ marginBottom: '10px', fontSize: '1.25rem', color: 'var(--color-ink)', fontWeight: 800 }}>
            Are you sure you want to quit {employedCompany?.name}?
          </h3>
          <p style={{ color: 'var(--color-teal)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
            You will no longer be able to complete assignments for this company. Your earned coins ({totalCoins}) and employment history will be preserved.
          </p>
        </div>
      </Modal>
    </div>
  );
};
