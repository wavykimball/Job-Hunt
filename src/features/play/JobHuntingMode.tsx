import React, { useState, useEffect, useCallback } from 'react';
import { Company } from '@/types/game';
import { SEEDED_COMPANIES } from '@/services/seedData';
import { ShotEvaluation } from '@/game/engine/ShotEvaluator';
import { ArcadeButton } from '@/components/ArcadeButton';
import { ArcadeCard } from '@/components/ArcadeCard';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface JobHuntingModeProps {
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  onApplicationSubmitted: (company: Company, shotId: string, outcome: 'offered' | 'under_review' | 'rejected') => void;
  onExitToDashboard: () => void;
  onRegisterShotHandler: (handler: (evaluation: ShotEvaluation) => void) => void;
  onPlaySwish: () => void;
  onPlayRimClank: () => void;
  onPlayFanfare: () => void;
}

export const JobHuntingMode: React.FC<JobHuntingModeProps> = ({
  selectedCompanyId,
  onSelectCompany: _onSelectCompany,
  onApplicationSubmitted,
  onExitToDashboard,
  onRegisterShotHandler,
  onPlaySwish,
  onPlayRimClank,
  onPlayFanfare,
}) => {
  const [attemptsRemaining, setAttemptsRemaining] = useState<Record<string, number>>({
    comp_cloudbounce: 3,
    comp_neongrid: 3,
    comp_apex: 3,
    comp_bytehoops: 3,
  });

  const [activeFeedback, setActiveFeedback] = useState<{
    show: boolean;
    success: boolean;
    isSwish: boolean;
    title: string;
    description: string;
    outcome?: 'offered' | 'under_review' | 'rejected';
  }>({
    show: false,
    success: false,
    isSwish: false,
    title: '',
    description: '',
  });

  const selectedCompany = SEEDED_COMPANIES.find((c) => c.id === selectedCompanyId) || SEEDED_COMPANIES[0];
  const currentAttempts = attemptsRemaining[selectedCompany.id] ?? 3;

  const handleShotEvaluated = useCallback((evaluation: ShotEvaluation) => {
    if (evaluation.success) {
      onPlaySwish();
      // Simulate hiring outcome
      const rand = Math.random();
      let outcome: 'offered' | 'under_review' | 'rejected' = 'under_review';

      if (rand <= selectedCompany.hiring_chance) {
        outcome = 'offered';
        onPlayFanfare();
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      } else if (rand <= selectedCompany.hiring_chance + 0.15) {
        outcome = 'under_review';
      } else {
        outcome = 'rejected';
      }

      const shotId = `shot_cv_${Date.now()}`;
      onApplicationSubmitted(selectedCompany, shotId, outcome);

      if (outcome === 'offered') {
        setActiveFeedback({
          show: true,
          success: true,
          isSwish: evaluation.isSwish,
          title: evaluation.isSwish ? 'PERFECT SWISH! JOB OFFER!' : 'CV IN! JOB OFFER RECEIVED!',
          description: `Outstanding shot! ${selectedCompany.name} was blown away by your CV and extended a formal offer!`,
          outcome: 'offered',
        });
      } else if (outcome === 'under_review') {
        setActiveFeedback({
          show: true,
          success: true,
          isSwish: evaluation.isSwish,
          title: 'CV SUBMITTED! UNDER REVIEW',
          description: `Nice basket! Your application was delivered to ${selectedCompany.name} and is currently under review.`,
          outcome: 'under_review',
        });
      } else {
        setActiveFeedback({
          show: true,
          success: true,
          isSwish: evaluation.isSwish,
          title: 'APPLICATION SUBMITTED',
          description: `Great shot! ${selectedCompany.name} reviewed your CV. Heavy competition for this role, but keep shooting at other companies!`,
          outcome: 'rejected',
        });
      }
    } else {
      onPlayRimClank();
      const nextAttempts = Math.max(0, currentAttempts - 1);
      setAttemptsRemaining((prev) => ({ ...prev, [selectedCompany.id]: nextAttempts }));

      setActiveFeedback({
        show: true,
        success: false,
        isSwish: false,
        title: evaluation.rimHit ? 'OFF THE RIM!' : 'MISSED HOOP!',
        description:
          nextAttempts > 0
            ? `Not quite! Adjust your power and angle. You have ${nextAttempts} attempt${nextAttempts > 1 ? 's' : ''} remaining.`
            : `You've used all 3 attempts for ${selectedCompany.name}. Pick another company hoop or retry!`,
      });
    }
  }, [
    currentAttempts,
    onApplicationSubmitted,
    onPlayFanfare,
    onPlayRimClank,
    onPlaySwish,
    selectedCompany,
  ]);

  useEffect(() => {
    onRegisterShotHandler(handleShotEvaluated);
  }, [onRegisterShotHandler, handleShotEvaluated]);

  const handleDismissFeedback = () => {
    setActiveFeedback((prev) => ({ ...prev, show: false }));
  };

  const handleResetAttempts = (companyId: string) => {
    setAttemptsRemaining((prev) => ({ ...prev, [companyId]: 3 }));
    setActiveFeedback((prev) => ({ ...prev, show: false }));
  };

  return (
    <>
      {/* Top Left Back Navigation */}
      <div
        style={{
          position: 'absolute',
          top: '56px',
          left: '14px',
          zIndex: 60,
          pointerEvents: 'auto',
        }}
      >
        <button
          onClick={onExitToDashboard}
          className="arcade-btn arcade-btn-secondary arcade-btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.82rem' }}
        >
          <ArrowLeft size={16} />
          <span className="nav-btn-text-full">Dashboard</span>
          <span className="nav-btn-text-short">Back</span>
        </button>
      </div>

      {/* Target Info and Aim Guide Overlay at Bottom */}
      <div className="bottom-overlay">
        {!activeFeedback.show && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              width: '100%',
              maxWidth: '480px',
            }}
          >
            {/* Aim guide banner */}
            <div className="aim-banner">
              🎯 Tap any board to switch company • Drag down & release to shoot CV at {selectedCompany.name}
            </div>

            {/* Selected company card */}
            <div
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.94)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 18px',
                border: `3px solid ${selectedCompany.accent_color}`,
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: selectedCompany.accent_color,
                    }}
                  />
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-ink)' }}>
                    {selectedCompany.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'var(--color-cloud)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1px solid var(--color-muted)',
                      color: 'var(--color-teal)',
                    }}
                  >
                    {selectedCompany.difficulty}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                  Applying for: {selectedCompany.role_title}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-navy)' }}>
                  Attempts:
                </span>
                <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
                  {[1, 2, 3].map((num) => (
                    <span
                      key={num}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: num <= currentAttempts ? selectedCompany.accent_color : '#D9E4E5',
                        border: '1px solid rgba(0,0,0,0.15)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shot Feedback Modal/Banner */}
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

            <p style={{ fontSize: '0.92rem', color: 'var(--color-ink)', marginBottom: '16px', lineHeight: 1.4 }}>
              {activeFeedback.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {currentAttempts === 0 && !activeFeedback.success ? (
                <ArcadeButton
                  variant="golden"
                  size="sm"
                  onClick={() => handleResetAttempts(selectedCompany.id)}
                >
                  <RefreshCw size={16} /> Reset Attempts
                </ArcadeButton>
              ) : (
                <ArcadeButton
                  variant={activeFeedback.success ? 'success' : 'secondary'}
                  size="sm"
                  onClick={handleDismissFeedback}
                >
                  {activeFeedback.success ? 'Continue' : 'Shoot Again'}
                </ArcadeButton>
              )}

              <ArcadeButton variant="secondary" size="sm" onClick={onExitToDashboard}>
                Back to Dashboard
              </ArcadeButton>
            </div>
          </ArcadeCard>
        )}
      </div>
    </>
  );
};
