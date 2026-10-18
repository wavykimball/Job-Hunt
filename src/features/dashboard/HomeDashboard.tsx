import React, { useState } from 'react';
import { ArcadeButton } from '@/components/ArcadeButton';
import { Modal } from '@/components/Modal';
import { Employment, Company } from '@/types/game';
import { Briefcase, Play, Pause, LogOut, Building2 } from 'lucide-react';

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
      {/* 1. Speech Bubble Callout floating cleanly above character's head (Unobstructed character in center) */}
      <div className="character-speech-bubble">
        {isUnemployed && (
          <>
            <span className="speech-bubble-tag" style={{ color: 'var(--color-coral)' }}>
              🏀 Unemployed Career Seeker
            </span>
            <div className="speech-bubble-text">
              Shoot your CV into company hoops to land a job!
            </div>
          </>
        )}
        {isEmployed && (
          <>
            <span className="speech-bubble-tag" style={{ color: 'var(--color-teal)' }}>
              ★ Employed • {employedCompany?.name}
            </span>
            <div className="speech-bubble-text">
              Deliver assigned work into the hoop to earn coins!
            </div>
          </>
        )}
        {isPaused && (
          <>
            <span className="speech-bubble-tag" style={{ color: 'var(--color-golden-yellow)' }}>
              ❚❚ Taking a Career Break
            </span>
            <div className="speech-bubble-text">
              You retain your role at {employedCompany?.name}. Resume anytime!
            </div>
          </>
        )}
      </div>

      {/* 2. Left Side Rail: Action button(s) cleanly docked on the left */}
      <div className="dashboard-left-rail">
        {/* Welcome & Persona Badge (Character customization button removed per instruction) */}
        <div className="rail-greeting-badge">
          <span className="rail-greeting-sub">3D Basketball Career Arcade</span>
          <div className="rail-greeting-row">
            <span className="rail-greeting-name">Welcome, {playerName}!</span>
          </div>
        </div>

        {/* --- UNEMPLOYED ACTION STACK --- */}
        {isUnemployed && (
          /* Primary Apply to Jobs button (no description, no "Ready" pill) */
          <div
            className="arcade-action-card card-coral"
            onClick={onStartJobHunting}
            role="button"
            tabIndex={0}
          >
            <div className="arcade-card-icon-bubble">
              <Briefcase size={22} />
            </div>
            <div className="arcade-card-info">
              <div className="arcade-card-title">Apply to Jobs</div>
            </div>
          </div>
        )}

        {/* --- EMPLOYED / ON BREAK ACTION STACK --- */}
        {(isEmployed || isPaused) && employedCompany && (
          <>
            {/* 1. Company Name (First) */}
            <div className="arcade-action-card card-teal" style={{ cursor: 'default' }}>
              <div
                className="arcade-card-icon-bubble"
                style={{ background: employedCompany.accent_color, border: '2px solid rgba(255,255,255,0.6)' }}
              >
                <Building2 size={20} />
              </div>
              <div className="arcade-card-info">
                <div className="arcade-card-title">{employedCompany.name}</div>
                <div className="arcade-card-sub">
                  {isPaused ? 'Status: On a Break' : currentEmployment?.role_title}
                </div>
              </div>
            </div>

            {/* 2. Continue Working (Next button under) */}
            <div
              className="arcade-action-card card-coral"
              onClick={isPaused ? onResumeEmployment : onStartWorking}
              role="button"
              tabIndex={0}
            >
              <div className="arcade-card-icon-bubble">
                <Play size={20} />
              </div>
              <div className="arcade-card-info">
                <div className="arcade-card-title">{isPaused ? 'Resume Work' : 'Continue Working'}</div>
              </div>
            </div>

            {/* 3. Break (Comes after) */}
            <div
              className="arcade-action-card card-golden"
              onClick={isPaused ? onResumeEmployment : onPauseEmployment}
              role="button"
              tabIndex={0}
            >
              <div className="arcade-card-icon-bubble" style={{ background: 'rgba(0,0,0,0.1)' }}>
                {isPaused ? <Play size={20} color="#102F3A" /> : <Pause size={20} color="#102F3A" />}
              </div>
              <div className="arcade-card-info">
                <div className="arcade-card-title" style={{ color: '#102F3A' }}>
                  {isPaused ? 'Resume' : 'Break'}
                </div>
              </div>
            </div>

            {/* 4. Quit (Comes last) */}
            <div
              className="arcade-action-card card-danger"
              onClick={() => setShowQuitConfirm(true)}
              role="button"
              tabIndex={0}
            >
              <div className="arcade-card-icon-bubble" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <LogOut size={20} />
              </div>
              <div className="arcade-card-info">
                <div className="arcade-card-title">Quit</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Bottom-Left Informational Hint (Looks less like a button, placed at bottom-left) */}
      <div className="dashboard-bottom-left-tip">
        <span className="tip-icon">🏀</span>
        <span className="tip-text">
          {isUnemployed && 'Drag backwards on court & release to shoot CVs into company hoops'}
          {isEmployed && 'Drag backwards on court & release to submit deliverables'}
          {isPaused && 'On a break: Resume work anytime to submit deliverables'}
        </span>
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
