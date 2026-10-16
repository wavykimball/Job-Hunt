import React, { useState } from 'react';
import { ArcadeButton } from '@/components/ArcadeButton';
import { ArcadeCard } from '@/components/ArcadeCard';
import { Briefcase, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onSignIn: (displayName: string) => Promise<void>;
  isLoading: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSignIn, isLoading }) => {
  const [customName, setCustomName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customName.trim() || 'Hoops Rookie';
    onSignIn(finalName);
  };

  const handleStartNgSignIn = () => {
    const returnTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://start.ng/?return_to=${returnTo}`;
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #193A46 0%, #102F3A 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <ArcadeCard
        style={{
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
          border: '3px solid var(--color-golden-yellow)',
          boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
          boxSizing: 'border-box',
        }}
      >
        {/* Arcade Title Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--color-golden-yellow)',
            color: 'var(--color-navy)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 900,
            fontSize: '0.82rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={16} /> 3D Basketball Career Arcade
        </div>

        <h1
          style={{
            fontSize: 'clamp(2rem, 5vw, 2.7rem)',
            color: 'var(--color-coral)',
            marginBottom: '8px',
            letterSpacing: '-0.02em',
          }}
        >
          JOB HUNT
        </h1>

        <p
          style={{
            fontSize: '0.98rem',
            color: 'var(--color-teal)',
            fontWeight: 700,
            marginBottom: '24px',
            lineHeight: 1.4,
          }}
        >
          Apply with your CV. Get hired. Complete work deliverables. Earn coins and rule the leaderboard.
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'left', marginBottom: '22px' }}>
            <label
              htmlFor="custom-player-name"
              style={{
                display: 'block',
                fontWeight: 900,
                fontSize: '0.85rem',
                color: 'var(--color-navy)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px',
              }}
            >
              Enter Custom Name
            </label>
            <input
              id="custom-player-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Jordan Rookie"
              maxLength={24}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--color-teal)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                fontWeight: 700,
                color: 'var(--color-ink)',
                outline: 'none',
                boxSizing: 'border-box',
                background: '#FFFFFF',
              }}
            />
            <span
              style={{
                display: 'block',
                fontSize: '0.78rem',
                color: 'var(--color-muted)',
                fontWeight: 700,
                marginTop: '6px',
              }}
            >
              Play as a guest or sign in below to sync your progress.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', boxSizing: 'border-box' }}>
            <ArcadeButton
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '1rem',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Briefcase size={20} />
              {isLoading ? 'Entering Arena...' : 'Play Job Hunt'}
            </ArcadeButton>

            <button
              type="button"
              onClick={handleStartNgSignIn}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 'var(--radius-pill)',
                border: '2px solid #292a23',
                background: '#d8fd71',
                color: '#292a23',
                fontWeight: 800,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxSizing: 'border-box',
                minHeight: '48px',
                transition: 'transform 100ms ease, box-shadow 100ms ease',
              }}
            >
              <span>⚡</span> Sign in with start.ng
            </button>
          </div>
        </form>

        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-muted)',
            fontSize: '0.78rem',
            color: 'var(--color-teal)',
            lineHeight: 1.4,
          }}
        >
          <strong>Save Progress:</strong> Log in with start.ng to keep your earnings, character, and leaderboard rank.
        </div>
      </ArcadeCard>
    </div>
  );
};
