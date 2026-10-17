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
    <div className="dashboard-screen-overlay">
      {/* 1. Floating Employment Status Pill directly above character's head (both desktop and mobile) */}
      <div className="character-head-status-pill">
        {isUnemployed && (
          <span className="status-pill status-pill-unemployed">Unemployed</span>
        )}
        {isEmployed && (
          <span className="status-pill status-pill-employed">
            Employed • {employedCompany?.name}
          </span>
        )}
        {isPaused && (
          <span className="status-pill status-pill-paused">
            On a Break • {employedCompany?.name}
          </span>
        )}
      </div>

      {/* 2. White Career Greeting Banner: moves to top-left on mobile; sits above deck on desktop */}
      <div className="career-greeting-banner">
        <span className="greeting-subtitle">Career Dashboard</span>
        <div className="greeting-title-row">
          <h2 className="greeting-title">Welcome, {playerName}!</h2>
          <button
            onClick={onOpenCharacterSetup}
            className="arcade-btn arcade-btn-golden arcade-btn-sm arcade-btn-icon greeting-palette-btn"
            title="Customize character appearance"
            aria-label="Customize character appearance"
          >
            <Palette size={14} />
          </button>
        </div>
      </div>

      {/* 3. Centered Arcade Dashboard Deck */}
      <div className="dashboard-deck-container">
        <ArcadeCard className="dashboard-deck-card">
          {/* Active Employment Card Info (if employed or paused) */}
          {(isEmployed || isPaused) && employedCompany && (
            <div
              style={{
                background: 'var(--color-cloud)',
                border: '2px solid var(--color-muted)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-md)',
                    background: employedCompany.accent_color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFF',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--color-ink)' }}>
                    {employedCompany.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                    Role: {currentEmployment?.role_title}
                  </div>
                </div>
              </div>

              {/* Pause / Resume action */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {isEmployed && (
                  <button
                    onClick={onPauseEmployment}
                    className="arcade-btn arcade-btn-secondary arcade-btn-sm"
                    title="Take a break from work"
                  >
                    <Pause size={13} /> Break
                  </button>
                )}
                {isPaused && (
                  <button
                    onClick={onResumeEmployment}
                    className="arcade-btn arcade-btn-golden arcade-btn-sm"
                    title="Resume working"
                  >
                    <Play size={13} /> Resume
                  </button>
                )}
                <button
                  onClick={() => setShowQuitConfirm(true)}
                  className="arcade-btn arcade-btn-danger arcade-btn-sm arcade-btn-icon"
                  title="Quit current job"
                  aria-label="Quit current job"
                >
                  <LogOut size={15} />
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
        <div className="dashboard-explainer-pill">
          {isUnemployed && (
            <>
              <span className="explainer-text-desktop">🏀 Drag backwards on the court to aim your CV at company hoops!</span>
              <span className="explainer-text-mobile">🏀 Drag backwards on court to aim CV at hoops!</span>
            </>
          )}
          {isEmployed && (
            <>
              <span className="explainer-text-desktop">💼 Submit deliverables into the hoop to earn coins for each completed task!</span>
              <span className="explainer-text-mobile">💼 Submit deliverables into hoop to earn coins!</span>
            </>
          )}
          {isPaused && (
            <>
              <span className="explainer-text-desktop">❚❚ On break: You retain your job, but cannot earn coins until resuming work.</span>
              <span className="explainer-text-mobile">❚❚ On break: Resume work to continue earning coins.</span>
            </>
          )}
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
